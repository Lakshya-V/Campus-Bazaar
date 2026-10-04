from decimal import Decimal
from io import BytesIO
from datetime import timedelta
from pathlib import Path
from tempfile import TemporaryDirectory

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core import mail
from django.urls import reverse
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase
from unittest.mock import patch

from .models import (
	Category, Conversation, CustomUser, Favorite, Listing, Message, Notification, Rating,
)


class ListingApiTests(APITestCase):
	def setUp(self):
		self.client = APIClient()
		self.seller = CustomUser.objects.create_user(
			username='seller',
			university_email='seller@vitstudent.ac.in',
			email='seller@vitstudent.ac.in',
			password='test-password',
		)
		self.other_user = CustomUser.objects.create_user(
			username='other',
			university_email='other@vitstudent.ac.in',
			email='other@vitstudent.ac.in',
			password='test-password',
		)
		self.category = Category.objects.create(name='Books', slug='books')

	def test_listings_are_public_and_creation_requires_authentication(self):
		response = self.client.get(reverse('listing-list'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)

		response = self.client.post(reverse('listing-list'), {
			'category': self.category.id,
			'title': 'Django book',
			'description': 'A useful book',
			'price': '25.00',
			'condition': 'Good',
		})
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_authenticated_user_creates_listing_with_image_url(self):
		self.client.force_authenticate(self.seller)
		response = self.client.post(reverse('listing-list'), {
			'category_id': self.category.id,
			'title': 'Django book',
			'description': 'A useful book',
			'price': '25.00',
			'condition': 'Good',
			'image_url': 'https://example.com/book.jpg',
		})

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		listing = Listing.objects.get()
		self.assertEqual(listing.seller, self.seller)
		self.assertEqual(listing.image_url, 'https://example.com/book.jpg')
		self.assertEqual(response.data['seller']['username'], self.seller.username)
		self.assertEqual(response.data['category']['id'], self.category.id)

	def test_multipart_listing_upload_stores_uploaded_public_url(self):
		self.client.force_authenticate(self.seller)
		image_buffer = BytesIO()
		Image.new('RGB', (1, 1)).save(image_buffer, format='PNG')
		with patch('core.serializers.upload_listing_image', return_value='https://storage.example/item.png'):
			response = self.client.post(reverse('listing-list'), {
				'category_id': self.category.id,
				'title': 'Uploaded book',
				'description': 'A photo upload',
				'price': '25.00',
				'condition': 'Good',
				'image': SimpleUploadedFile('book.png', image_buffer.getvalue(), content_type='image/png'),
			}, format='multipart')

		self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
		self.assertEqual(response.data['image_url'], 'https://storage.example/item.png')

	def test_multipart_listing_upload_uses_local_media_storage_without_supabase(self):
		self.client.force_authenticate(self.seller)
		image_buffer = BytesIO()
		Image.new('RGB', (1, 1)).save(image_buffer, format='PNG')
		with TemporaryDirectory() as media_directory, override_settings(
			MEDIA_ROOT=media_directory,
			SUPABASE_URL=None,
			SUPABASE_KEY=None,
		):
			response = self.client.post(reverse('listing-list'), {
				'category_id': self.category.id,
				'title': 'Locally uploaded book',
				'description': 'Stored in Django media',
				'price': '25.00',
				'condition': 'Good',
				'image': SimpleUploadedFile(
					'book.png',
					image_buffer.getvalue(),
					content_type='image/png',
				),
			}, format='multipart')

			self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
			self.assertTrue(response.data['image_url'].startswith('/media/listings/'))
			image_path = Path(media_directory) / response.data['image_url'].removeprefix('/media/')
			self.assertTrue(image_path.is_file())

	def test_multipart_listing_upload_falls_back_when_supabase_upload_fails(self):
		self.client.force_authenticate(self.seller)
		image_buffer = BytesIO()
		Image.new('RGB', (1, 1)).save(image_buffer, format='PNG')
		with TemporaryDirectory() as media_directory, override_settings(
			MEDIA_ROOT=media_directory,
			SUPABASE_URL='https://example.supabase.co/rest/v1/',
			SUPABASE_KEY='test-key',
		), patch('core.utils.create_client') as create_client, self.assertLogs(
			'core.utils', level='WARNING'
		):
			create_client.return_value.storage.from_.return_value.upload.side_effect = RuntimeError(
				'Storage policy denied upload'
			)
			response = self.client.post(reverse('listing-list'), {
				'category_id': self.category.id,
				'title': 'Supabase fallback book',
				'description': 'Stored locally after remote upload failure',
				'price': '25.00',
				'condition': 'Good',
				'image': SimpleUploadedFile(
					'book.png',
					image_buffer.getvalue(),
					content_type='image/png',
				),
			}, format='multipart')

			create_client.assert_called_once_with('https://example.supabase.co', 'test-key')
			self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
			self.assertTrue(response.data['image_url'].startswith('/media/listings/'))
			image_path = Path(media_directory) / response.data['image_url'].removeprefix('/media/')
			self.assertTrue(image_path.is_file())

	def test_listing_image_upload_failure_is_logged_with_exception_details(self):
		self.client.force_authenticate(self.seller)
		image_buffer = BytesIO()
		Image.new('RGB', (1, 1)).save(image_buffer, format='PNG')
		with patch(
			'core.serializers.upload_listing_image',
			side_effect=RuntimeError('Storage bucket listing-images is unavailable'),
		), self.assertLogs('core.serializers', level='ERROR') as captured:
			response = self.client.post(reverse('listing-list'), {
				'category_id': self.category.id,
				'title': 'Upload failure',
				'description': 'Should return a client error and log the storage failure',
				'price': '25.00',
				'condition': 'Good',
				'image': SimpleUploadedFile(
					'book.png',
					image_buffer.getvalue(),
					content_type='image/png',
				),
			}, format='multipart')

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('Storage bucket listing-images is unavailable', captured.output[0])

	def test_listing_creation_requires_a_category(self):
		self.client.force_authenticate(self.seller)
		response = self.client.post(reverse('listing-list'), {
			'title': 'Django book',
			'description': 'A useful book',
			'price': '25.00',
			'condition': 'Good',
		})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_listing_response_embeds_seller_and_category(self):
		listing = Listing.objects.create(
			seller=self.seller,
			category=self.category,
			title='Django book',
			description='A useful book',
			price=Decimal('25.00'),
			condition='Good',
		)
		response = self.client.get(reverse('listing-detail', args=[listing.id]))

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['seller']['username'], self.seller.username)
		self.assertEqual(response.data['category'], {
			'id': self.category.id,
			'name': self.category.name,
			'slug': self.category.slug,
		})

	def test_only_seller_can_update_listing(self):
		listing = Listing.objects.create(
			seller=self.seller,
			category=self.category,
			title='Django book',
			description='A useful book',
			price=Decimal('25.00'),
			condition='Good',
		)
		self.client.force_authenticate(self.other_user)
		response = self.client.patch(reverse('listing-detail', args=[listing.id]), {'title': 'Changed'})
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_seller_can_toggle_listing_status(self):
		listing = Listing.objects.create(
			seller=self.seller,
			category=self.category,
			title='Django book',
			description='A useful book',
			price=Decimal('25.00'),
			condition='Good',
		)
		self.client.force_authenticate(self.seller)
		response = self.client.patch(
			reverse('listing-detail', args=[listing.id]),
			{'status': Listing.Status.SOLD},
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		listing.refresh_from_db()
		self.assertEqual(listing.status, Listing.Status.SOLD)

	def test_listing_filters_include_price_and_search(self):
		Listing.objects.create(
			seller=self.seller,
			category=self.category,
			title='Django book',
			description='A useful book',
			price=Decimal('25.00'),
			condition='Good',
		)
		Listing.objects.create(
			seller=self.seller,
			category=self.category,
			title='Desk lamp',
			description='Bright light',
			price=Decimal('75.00'),
			condition='Fair',
		)

		response = self.client.get(reverse('listing-list'), {
			'category': self.category.id,
			'min_price': '20',
			'max_price': '30',
			'search': 'book',
		})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]['title'], 'Django book')


class MessagingAndFavoritesApiTests(APITestCase):
	def setUp(self):
		self.client = APIClient()
		self.buyer = CustomUser.objects.create_user(
			username='buyer', university_email='buyer@vitstudent.ac.in',
			email='buyer@vitstudent.ac.in', password='test-password',
		)
		self.seller = CustomUser.objects.create_user(
			username='seller', university_email='seller@vitstudent.ac.in',
			email='seller@vitstudent.ac.in', password='test-password',
		)
		self.category = Category.objects.create(name='Books', slug='books')
		self.listing = Listing.objects.create(
			seller=self.seller, category=self.category,
			title='Calculator', description='Scientific calculator',
			price=Decimal('20.00'), condition='Good',
		)

	def test_message_image_upload_is_persisted_and_returned_as_absolute_url(self):
		conversation = Conversation.objects.create(
			listing=self.listing,
			buyer=self.buyer,
			seller=self.seller,
		)
		image_buffer = BytesIO()
		Image.new('RGB', (1, 1)).save(image_buffer, format='PNG')
		self.client.force_authenticate(self.buyer)

		with TemporaryDirectory() as media_directory, override_settings(
			MEDIA_ROOT=media_directory,
			SUPABASE_URL=None,
			SUPABASE_KEY=None,
		):
			response = self.client.post(reverse('message-list'), {
				'conversation_id': conversation.id,
				'text': '[Shared image]',
				'media_type': 'image',
				'attachment': SimpleUploadedFile(
					'chat-image.png',
					image_buffer.getvalue(),
					content_type='image/png',
				),
			}, format='multipart')

			self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
			self.assertTrue(response.data['image_url'].startswith('http://testserver/media/chat/'))
			self.assertEqual(response.data['media_type'], 'image')
			message = Message.objects.get()
			image_path = Path(media_directory) / message.image_url.removeprefix('/media/')
			self.assertTrue(image_path.is_file())

	def test_buyer_can_start_conversation_and_both_participants_can_message(self):
		self.client.force_authenticate(self.buyer)
		response = self.client.post(reverse('conversation-list'), {'listing': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		conversation = Conversation.objects.get()
		self.assertEqual(conversation.buyer, self.buyer)
		self.assertEqual(conversation.seller, self.seller)
		self.assertTrue(Notification.objects.filter(
			recipient=self.seller,
			conversation=conversation,
			message__isnull=True,
		).exists())

		response = self.client.post(reverse('message-list'), {
			'conversation': conversation.id, 'text': 'Is this still available?',
		})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(Notification.objects.filter(
			recipient=self.seller,
			conversation=conversation,
			message__isnull=False,
		).exists())
		self.client.force_authenticate(self.seller)
		response = self.client.get(reverse('message-list'), {'conversation': conversation.id})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)

	def test_conversations_and_notifications_are_visible_to_the_seller_and_mark_read(self):
		self.client.force_authenticate(self.buyer)
		response = self.client.post(reverse('conversation-list'), {'listing_id': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
		conversation_id = response.data['id']
		self.client.force_authenticate(self.seller)

		response = self.client.get(reverse('conversation-list'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual([conversation['id'] for conversation in response.data], [conversation_id])

		response = self.client.get(reverse('notification-list'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data[0]['conversation_id'], conversation_id)
		self.assertFalse(response.data[0]['is_read'])

		response = self.client.post('/api/notifications/mark-read/', {
			'conversation_id': conversation_id,
		})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['updated'], 1)

		self.client.force_authenticate(self.buyer)
		response = self.client.get(reverse('notification-list'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, [])

	def test_conversation_by_listing_and_nested_messages_endpoints(self):
		self.client.force_authenticate(self.buyer)
		url = f'/api/conversations/by-listing/{self.listing.id}/'
		response = self.client.post(url)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		conversation_id = response.data['id']
		self.assertEqual(response.data['listing']['title'], self.listing.title)
		self.assertEqual(response.data['seller']['username'], self.seller.username)

		response = self.client.get(f'/api/conversations/{conversation_id}/messages/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, [])

		response = self.client.post(
			f'/api/conversations/{conversation_id}/messages/',
			{'text': 'Is pickup available today?'},
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['sender']['username'], self.buyer.username)

		response = self.client.get(f'/api/conversations/{conversation_id}/messages/')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data[0]['text'], 'Is pickup available today?')

	def test_non_participant_cannot_view_or_send_messages(self):
		conversation = Conversation.objects.create(
			listing=self.listing, buyer=self.buyer, seller=self.seller,
		)
		outsider = CustomUser.objects.create_user(
			username='outsider', university_email='outsider@vitstudent.ac.in',
			email='outsider@vitstudent.ac.in', password='test-password',
		)
		self.client.force_authenticate(outsider)
		response = self.client.get(reverse('message-list'), {'conversation': conversation.id})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data, [])
		response = self.client.post(reverse('message-list'), {
			'conversation': conversation.id, 'text': 'Hello',
		})
		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_favorite_post_toggles_and_list_is_user_scoped(self):
		self.client.force_authenticate(self.buyer)
		url = reverse('favorite-list')
		response = self.client.post(url, {'listing_id': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(Favorite.objects.filter(user=self.buyer, listing=self.listing).exists())
		response = self.client.get(url)
		self.assertEqual(len(response.data), 1)

		response = self.client.post(url, {'listing_id': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(Favorite.objects.exists())

	def test_toggle_endpoint_returns_bookmark_state_and_rejects_invalid_ids(self):
		self.client.force_authenticate(self.buyer)
		url = reverse('favorite-toggle')
		response = self.client.post(url, {'listing_id': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(response.data['favorited'])

		response = self.client.post(url, {'listing_id': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertFalse(response.data['favorited'])

		response = self.client.post(url, {'listing_id': 'not-an-id'})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	def test_invalid_message_filter_returns_bad_request(self):
		self.client.force_authenticate(self.buyer)
		response = self.client.get(reverse('message-list'), {'conversation': 'not-an-id'})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

		response = self.client.post('/api/conversations/by-listing/not-an-id/')
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class EmailVerificationApiTests(APITestCase):
    def test_registration_restricts_email_domain_and_otp_verifies_once(self):
        response = self.client.post(reverse('register'), {
            'username': 'VIT Student',
            'university_email': 'user@example.com',
            'password': 'valid-password-123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        email = 'vitstudent@vitstudent.ac.in'
        response = self.client.post(reverse('register'), {
            'username': 'VIT Student',
            'university_email': email,
            'password': 'valid-password-123',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        duplicate_response = self.client.post(reverse('register'), {
            'username': 'Another Name',
            'university_email': email.upper(),
            'password': 'valid-password-123',
        })
        self.assertEqual(duplicate_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('university_email', duplicate_response.data)
        self.assertEqual(CustomUser.objects.filter(university_email__iexact=email).count(), 1)

        response = self.client.post(reverse('send-otp'), {'university_email': email})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = CustomUser.objects.get(university_email=email)
        self.assertRegex(user.otp_code, r'^\d{6}$')
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(user.otp_code, mail.outbox[0].body)

        response = self.client.post(reverse('verify-otp'), {
            'university_email': email,
            'otp_code': user.otp_code,
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.is_verified_student)
        self.assertIsNone(user.otp_code)
        self.assertIsNone(user.otp_created_at)

        response = self.client.post(reverse('verify-otp'), {
            'university_email': email,
            'otp_code': '000000',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_requires_verified_account_and_exact_campus_domain(self):
        user = CustomUser.objects.create_user(
            username='vitstudent',
            university_email='vitstudent@vitstudent.ac.in',
            email='vitstudent@vitstudent.ac.in',
            password='valid-password-123',
        )
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': user.university_email,
            'password': 'valid-password-123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        user.is_verified_student = True
        user.save(update_fields=['is_verified_student'])
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'vitstudent@gmail.com',
            'password': 'valid-password-123',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(reverse('token_obtain_pair'), {
            'username': user.university_email,
            'password': 'valid-password-123',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_expired_code_is_cleared(self):
        user = CustomUser.objects.create_user(
            username='expired',
            university_email='expired@vitstudent.ac.in',
            email='expired@vitstudent.ac.in',
            password='valid-password-123',
            otp_code='123456',
            otp_created_at=timezone.now() - timedelta(minutes=11),
        )
        response = self.client.post(reverse('verify-otp'), {
            'university_email': user.university_email,
            'otp_code': '123456',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        user.refresh_from_db()
        self.assertIsNone(user.otp_code)
        self.assertIsNone(user.otp_created_at)


class RatingApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.buyer = CustomUser.objects.create_user(
            username='buyer', university_email='buyer@vitstudent.ac.in',
            email='buyer@vitstudent.ac.in', password='test-password',
        )
        self.seller = CustomUser.objects.create_user(
            username='seller', university_email='seller@vitstudent.ac.in',
            email='seller@vitstudent.ac.in', password='test-password',
        )
        self.category = Category.objects.create(name='Books', slug='books')
        self.listing = Listing.objects.create(
            seller=self.seller, category=self.category, title='Textbook',
            description='Course text', price=Decimal('10.00'), condition='Good',
            status=Listing.Status.SOLD,
        )
        self.conversation = Conversation.objects.create(
            listing=self.listing, buyer=self.buyer, seller=self.seller,
        )

    def test_participant_can_rate_once_and_listing_returns_aggregate(self):
        self.client.force_authenticate(self.buyer)
        response = self.client.post(reverse('rating-list'), {
            'conversation': self.conversation.id,
            'score': 4,
            'comment': 'Smooth exchange',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Rating.objects.get().rated_user, self.seller)

        response = self.client.post(reverse('rating-list'), {
            'conversation': self.conversation.id,
            'score': 5,
            'comment': '',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.get(reverse('listing-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['seller']['rating_average'], 4.0)
        self.assertEqual(response.data[0]['seller']['rating_count'], 1)

        response = self.client.get(reverse('rating-list'), {'seller_id': self.seller.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['rated_user']['id'], self.seller.id)

    def test_outsider_cannot_rate_conversation(self):
        outsider = CustomUser.objects.create_user(
            username='outsider', university_email='outsider@vitstudent.ac.in',
            email='outsider@vitstudent.ac.in', password='test-password',
        )
        self.client.force_authenticate(outsider)
        response = self.client.post(reverse('rating-list'), {
            'conversation': self.conversation.id,
            'score': 5,
            'comment': '',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
