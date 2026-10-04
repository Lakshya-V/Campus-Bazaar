from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CategoryViewSet,
    ConversationViewSet,
    FavoriteViewSet,
    ListingViewSet,
    MessageViewSet,
    NotificationViewSet,
    RatingViewSet,
    RegisterView,
    SendEmailOTPView,
    UserProfileView,
    VerifyEmailOTPView,
    EmailTokenObtainPairView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('listings', ListingViewSet, basename='listing')
router.register('conversations', ConversationViewSet, basename='conversation')
router.register('messages', MessageViewSet, basename='message')
router.register('notifications', NotificationViewSet, basename='notification')
router.register('favorites', FavoriteViewSet, basename='favorite')
router.register('ratings', RatingViewSet, basename='rating')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/send-otp/', SendEmailOTPView.as_view(), name='send-otp'),
    path('auth/verify-otp/', VerifyEmailOTPView.as_view(), name='verify-otp'),
    path('auth/login/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
]