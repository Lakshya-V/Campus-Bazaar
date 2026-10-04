import secrets
from datetime import timedelta

from django.core.mail import send_mail
from django.db.models import Q
from django.db import transaction
from django.utils import timezone

from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import (
    Category, Conversation, CustomUser, Favorite, Listing, Message, Notification, Rating,
)
from .serializers import (
    CategorySerializer,
    ConversationSerializer,
    EmailOTPRequestSerializer,
    EmailOTPVerifySerializer,
    FavoriteSerializer,
    ListingSerializer,
    MessageSerializer,
    NotificationSerializer,
    RatingSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    EmailTokenObtainPairSerializer,
)


def positive_integer(value, field_name):
    if isinstance(value, bool) or not (
        isinstance(value, int) or isinstance(value, str) and value.isdecimal()
    ):
        raise ValidationError({field_name: 'A valid integer is required.'})
    try:
        parsed_value = int(value)
    except (TypeError, ValueError):
        raise ValidationError({field_name: 'A valid integer is required.'})
    if parsed_value < 1:
        raise ValidationError({field_name: 'A valid integer is required.'})
    return parsed_value


def notify_message_recipient(message):
    conversation = message.conversation
    recipient = (
        conversation.seller
        if message.sender_id == conversation.buyer_id
        else conversation.buyer
    )
    Notification.objects.create(
        recipient=recipient,
        sender=message.sender,
        conversation=conversation,
        message=message,
    )


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]


class SendEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['university_email'].lower()
        try:
            user = CustomUser.objects.get(university_email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response(
                {'detail': 'Create an account before requesting email verification.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if user.is_verified_student:
            return Response({'detail': 'This account is already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        user.otp_code = f'{secrets.randbelow(1_000_000):06d}'
        user.otp_created_at = timezone.now()
        user.save(update_fields=['otp_code', 'otp_created_at'])
        send_mail(
            subject='Your Campus Bazaar verification code',
            message=f'Your Campus Bazaar verification code is {user.otp_code}. It expires in 10 minutes.',
            from_email=None,
            recipient_list=[user.university_email],
            fail_silently=False,
        )
        return Response({'detail': 'Verification code sent.'}, status=status.HTTP_200_OK)


class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['university_email'].lower()
        otp_code = serializer.validated_data['otp_code']
        try:
            user = CustomUser.objects.get(university_email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)
        if user.is_verified_student:
            return Response({'detail': 'This account is already verified.'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.otp_code or not user.otp_created_at:
            return Response({'detail': 'Request a verification code first.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.otp_created_at < timezone.now() - timedelta(minutes=10):
            user.otp_code = None
            user.otp_created_at = None
            user.save(update_fields=['otp_code', 'otp_created_at'])
            return Response({'detail': 'Verification code expired. Request another code.'}, status=status.HTTP_400_BAD_REQUEST)
        if not secrets.compare_digest(user.otp_code, otp_code):
            return Response({'detail': 'Verification code is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_verified_student = True
        user.otp_code = None
        user.otp_created_at = None
        user.save(update_fields=['is_verified_student', 'otp_code', 'otp_created_at'])
        return Response({'detail': 'Email verified.', 'is_verified_student': True})


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.method in permissions.SAFE_METHODS or obj.seller == request.user


class CategoryViewSet(ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ListingViewSet(ModelViewSet):
    queryset = Listing.objects.select_related('seller', 'category').all()
    serializer_class = ListingSerializer
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['category', 'condition', 'status']
    search_fields = ['title', 'description']

    def get_queryset(self):
        queryset = super().get_queryset()
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        return queryset

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class ConversationViewSet(ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        return Conversation.objects.filter(Q(buyer=user) | Q(seller=user)).select_related(
            'listing', 'listing__seller', 'listing__category', 'buyer', 'seller',
        ).prefetch_related('messages')

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id') or request.data.get('listing')
        if not listing_id:
            return Response({'error': 'listing_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        listing_id = positive_integer(listing_id, 'listing_id')
        try:
            listing = Listing.objects.select_related('seller').get(id=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        if listing.seller_id == request.user.id:
            return Response({'error': 'You cannot start a conversation with yourself.'}, status=status.HTTP_400_BAD_REQUEST)

        conversation, created = Conversation.objects.get_or_create(
            listing=listing,
            buyer=request.user,
            defaults={'seller': listing.seller}
        )
        if created:
            Notification.objects.create(
                recipient=listing.seller,
                sender=request.user,
                conversation=conversation,
            )
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['get', 'post'], url_path='by-listing/(?P<listing_id>[^/.]+)')
    def by_listing(self, request, listing_id=None):
        listing_id = positive_integer(listing_id, 'listing_id')
        try:
            listing = Listing.objects.select_related('seller').get(id=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.method == 'GET':
            conv = Conversation.objects.filter(
                listing=listing
            ).filter(Q(buyer=request.user) | Q(seller=request.user)).select_related(
                'listing', 'buyer', 'seller'
            ).first()
            if not conv:
                return Response({'detail': 'No conversation found.'}, status=status.HTTP_404_NOT_FOUND)
            return Response(self.get_serializer(conv).data)
        else:
            if listing.seller_id == request.user.id:
                return Response({'error': 'You cannot start a conversation with yourself.'}, status=status.HTTP_400_BAD_REQUEST)
            conv, created = Conversation.objects.get_or_create(
                listing=listing,
                buyer=request.user,
                defaults={'seller': listing.seller}
            )
            if created:
                Notification.objects.create(
                    recipient=listing.seller,
                    sender=request.user,
                    conversation=conv,
                )
            return Response(self.get_serializer(conv).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['get', 'post'], url_path='messages')
    def messages(self, request, pk=None):
        conversation = self.get_object()
        if request.user not in (conversation.buyer, conversation.seller):
            raise PermissionDenied('You are not a participant in this conversation.')

        if request.method == 'GET':
            msgs = conversation.messages.select_related('sender').order_by('timestamp')
            serializer = MessageSerializer(msgs, many=True, context={'request': request})
            return Response(serializer.data)
        else:
            payload = request.data.copy()
            payload['conversation_id'] = conversation.id
            serializer = MessageSerializer(data=payload, context={'request': request})
            serializer.is_valid(raise_exception=True)
            message = serializer.save(conversation=conversation, sender=request.user)
            notify_message_recipient(message)
            return Response(
                MessageSerializer(message, context={'request': request}).data,
                status=status.HTTP_201_CREATED,
            )


class MessageViewSet(ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, FormParser, MultiPartParser]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        queryset = Message.objects.filter(
            Q(conversation__buyer=user) | Q(conversation__seller=user),
        ).select_related('sender', 'conversation').order_by('timestamp')
        conversation_id = self.request.query_params.get('conversation') or self.request.query_params.get('conversation_id')
        if conversation_id:
            conversation_id = positive_integer(conversation_id, 'conversation')
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        if self.request.user not in (conversation.buyer, conversation.seller):
            raise PermissionDenied('You are not a participant in this conversation.')
        message = serializer.save(sender=self.request.user)
        notify_message_recipient(message)


class FavoriteViewSet(GenericViewSet):
    queryset = Favorite.objects.all()
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.queryset.none()
        return Favorite.objects.filter(user=self.request.user).select_related(
            'listing', 'listing__category', 'listing__seller',
        )

    def list(self, request, *args, **kwargs):
        serializer = self.get_serializer(self.get_queryset(), many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id') or request.data.get('listing')
        if not listing_id:
            return Response({'error': 'listing_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        listing_id = positive_integer(listing_id, 'listing_id')
        try:
            listing = Listing.objects.get(id=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        favorite, created = Favorite.objects.get_or_create(user=request.user, listing=listing)
        if not created:
            favorite.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(self.get_serializer(favorite).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='toggle')
    @transaction.atomic
    def toggle(self, request, *args, **kwargs):
        listing_id = request.data.get('listing_id') or request.data.get('listing')
        if not listing_id:
            return Response({'error': 'listing_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        listing_id = positive_integer(listing_id, 'listing_id')
        try:
            listing = Listing.objects.select_for_update().get(id=listing_id)
        except Listing.DoesNotExist:
            return Response({'error': 'Listing not found.'}, status=status.HTTP_404_NOT_FOUND)

        favorite = Favorite.objects.filter(user=request.user, listing=listing).first()
        if favorite:
            favorite.delete()
            return Response({'favorited': False, 'listing_id': int(listing_id)}, status=status.HTTP_200_OK)
        else:
            new_fav = Favorite.objects.create(user=request.user, listing=listing)
            return Response({
                'favorited': True,
                'listing_id': int(listing_id),
                'favorite': self.get_serializer(new_fav).data
            }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        favorite = self.get_object()
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class RatingViewSet(ModelViewSet):
    queryset = Rating.objects.select_related('rater', 'rated_user', 'conversation')
    serializer_class = RatingSerializer
    http_method_names = ['get', 'post', 'head', 'options']
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        rated_user_id = self.request.query_params.get('rated_user')
        seller_id = self.request.query_params.get('seller_id')
        conversation_id = self.request.query_params.get('conversation')
        if seller_id:
            queryset = queryset.filter(rated_user_id=positive_integer(seller_id, 'seller_id'))
        if rated_user_id:
            queryset = queryset.filter(rated_user_id=positive_integer(rated_user_id, 'rated_user'))
        if conversation_id:
            queryset = queryset.filter(conversation_id=positive_integer(conversation_id, 'conversation'))
        return queryset


class NotificationViewSet(GenericViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user,
        ).select_related('sender', 'conversation__listing', 'message')

    def list(self, request, *args, **kwargs):
        return Response(self.get_serializer(self.get_queryset()[:50], many=True).data)

    @action(detail=False, methods=['post'], url_path='mark-read')
    def mark_read(self, request):
        conversation_id = request.data.get('conversation_id')
        if not conversation_id:
            raise ValidationError({'conversation_id': 'This field is required.'})
        conversation_id = positive_integer(conversation_id, 'conversation_id')
        updated = self.get_queryset().filter(
            conversation_id=conversation_id,
            is_read=False,
        ).update(is_read=True)
        return Response({'updated': updated})