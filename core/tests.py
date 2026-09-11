from decimal import Decimal
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from .models import Category, Conversation, CustomUser, Favorite, Listing, Message


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

	@patch('core.serializers.upload_listing_image', return_value='https://example.com/book.jpg')
	def test_authenticated_user_creates_listing_with_uploaded_image(self, upload_image):
		self.client.force_authenticate(self.seller)
		response = self.client.post(reverse('listing-list'), {
			'category': self.category.id,
			'title': 'Django book',
			'description': 'A useful book',
			'price': '25.00',
			'condition': 'Good',
		})

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		listing = Listing.objects.get()
		self.assertEqual(listing.seller, self.seller)
		self.assertEqual(listing.image_url, '')
		upload_image.assert_not_called()

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
		self.listing = Listing.objects.create(
			seller=self.seller, title='Calculator', description='Scientific calculator',
			price=Decimal('20.00'), condition='Good',
		)

	def test_buyer_can_start_conversation_and_both_participants_can_message(self):
		self.client.force_authenticate(self.buyer)
		response = self.client.post(reverse('conversation-list'), {'listing': self.listing.id})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		conversation = Conversation.objects.get()
		self.assertEqual(conversation.buyer, self.buyer)
		self.assertEqual(conversation.seller, self.seller)

		response = self.client.post(reverse('message-list'), {
			'conversation': conversation.id, 'text': 'Is this still available?',
		})
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.client.force_authenticate(self.seller)
		response = self.client.get(reverse('message-list'), {'conversation': conversation.id})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)

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
