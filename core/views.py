from django.shortcuts import render
from django.db.models import Q

# Create your views here.
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework.response import Response
from .models import Category, Conversation, CustomUser, Favorite, Listing, Message
from .serializers import (
    CategorySerializer,
    ConversationSerializer,
    FavoriteSerializer,
    ListingSerializer,
    MessageSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    EmailTokenObtainPairSerializer,
)

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

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


class ConversationViewSet(ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        return Conversation.objects.filter(Q(buyer=user) | Q(seller=user)).select_related(
            'listing', 'buyer', 'seller',
        )

    def perform_create(self, serializer):
        listing = serializer.validated_data['listing']
        serializer.save(buyer=self.request.user, seller=listing.seller)


class MessageViewSet(ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return self.queryset.none()
        queryset = Message.objects.filter(
            Q(conversation__buyer=user) | Q(conversation__seller=user),
        ).select_related('sender', 'conversation')
        conversation_id = self.request.query_params.get('conversation')
        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)
        return queryset

    def perform_create(self, serializer):
        conversation = serializer.validated_data['conversation']
        if self.request.user not in (conversation.buyer, conversation.seller):
            raise permissions.PermissionDenied('You are not a participant in this conversation.')
        serializer.save(sender=self.request.user)


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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.validated_data['listing']
        favorite, created = Favorite.objects.get_or_create(user=request.user, listing=listing)
        if not created:
            favorite.delete()
            return Response(status=204)
        return Response(self.get_serializer(favorite).data, status=201)

    def destroy(self, request, *args, **kwargs):
        favorite = self.get_object()
        favorite.delete()
        return Response(status=204)