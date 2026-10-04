import re
import logging

from django.core.validators import RegexValidator
from django.db import IntegrityError, transaction
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    Category, Conversation, CustomUser, Favorite, Listing, Message, Notification, Rating,
)
from .utils import upload_chat_attachment, upload_listing_image

logger = logging.getLogger(__name__)

CAMPUS_EMAIL_VALIDATOR = RegexValidator(
    regex=r'^[A-Za-z0-9._%+-]+@vitstudent\.ac\.in$',
    message='Use your @vitstudent.ac.in email address.',
    flags=re.IGNORECASE,
)

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        if not username or not re.fullmatch(
            r'[A-Za-z0-9._%+-]+@vitstudent\.ac\.in', username, flags=re.IGNORECASE
        ):
            raise serializers.ValidationError(
                {'detail': 'Use your @vitstudent.ac.in email address.'}
            )
        user = CustomUser.objects.filter(university_email__iexact=username).first()
        if user:
            if not user.is_verified_student:
                raise serializers.ValidationError(
                    {'detail': 'Verify your campus email before signing in.'}
                )
            attrs[self.username_field] = user.username
        return super().validate(attrs)

class UserRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        max_length=150,
        validators=[UniqueValidator(queryset=CustomUser.objects.all())],
    )
    password = serializers.CharField(write_only=True)
    university_email = serializers.EmailField(validators=[CAMPUS_EMAIL_VALIDATOR])

    class Meta:
        model = CustomUser
        fields = ['username', 'university_email', 'password', 'hostel_building', 'graduation_year', 'phone_number']

    def validate_university_email(self, value):
        normalized_email = value.strip().lower()
        if CustomUser.objects.filter(university_email__iexact=normalized_email).exists():
            raise serializers.ValidationError('An account with this campus email already exists.')
        return normalized_email

    def create(self, validated_data):
        try:
            with transaction.atomic():
                return CustomUser.objects.create_user(
                    username=validated_data['username'],
                    email=validated_data['university_email'],
                    university_email=validated_data['university_email'],
                    password=validated_data['password'],
                    hostel_building=validated_data.get('hostel_building', ''),
                    graduation_year=validated_data.get('graduation_year'),
                    phone_number=validated_data.get('phone_number', ''),
                )
        except IntegrityError:
            if CustomUser.objects.filter(
                university_email__iexact=validated_data['university_email']
            ).exists():
                raise serializers.ValidationError({
                    'university_email': 'An account with this campus email already exists.'
                })
            if CustomUser.objects.filter(username=validated_data['username']).exists():
                raise serializers.ValidationError({
                    'username': 'An account with this name already exists.'
                })
            raise

class UserProfileSerializer(serializers.ModelSerializer):
    rating_average = serializers.FloatField(read_only=True)
    rating_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'university_email', 'hostel_building', 'graduation_year', 'phone_number', 'is_verified_student', 'rating_average', 'rating_count']
        read_only_fields = ['id', 'university_email', 'is_verified_student']

class UserPublicSerializer(serializers.ModelSerializer):
    rating_average = serializers.FloatField(read_only=True)
    rating_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'university_email', 'hostel_building', 'phone_number', 'is_verified_student', 'rating_average', 'rating_count']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class ListingSerializer(serializers.ModelSerializer):
    image_url = serializers.URLField(required=False, allow_blank=True)
    image = serializers.ImageField(write_only=True, required=False)
    seller = UserPublicSerializer(read_only=True)
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            'id', 'seller', 'seller_id', 'category', 'category_id', 'title', 'description', 'price',
            'condition', 'status', 'image_url', 'image', 'is_favorited', 'created_at',
        ]
        read_only_fields = ['id', 'seller', 'seller_id', 'is_favorited', 'created_at']

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, listing=obj).exists()
        return False

    def validate_condition(self, value):
        if not value:
            return Listing.Condition.GOOD
        val_lower = str(value).strip().lower()
        if 'book' in val_lower or 'note' in val_lower:
            return Listing.Condition.BOOKS_NOTES
        if 'like' in val_lower:
            return Listing.Condition.LIKE_NEW
        if 'new' in val_lower:
            return Listing.Condition.NEW
        if 'fair' in val_lower:
            return Listing.Condition.FAIR
        return Listing.Condition.GOOD

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'condition' in mutable_data:
            cond = str(mutable_data['condition']).strip().lower()
            if 'book' in cond or 'note' in cond:
                mutable_data['condition'] = Listing.Condition.BOOKS_NOTES
            elif 'like' in cond:
                mutable_data['condition'] = Listing.Condition.LIKE_NEW
            elif 'new' in cond:
                mutable_data['condition'] = Listing.Condition.NEW
            elif 'fair' in cond:
                mutable_data['condition'] = Listing.Condition.FAIR
            else:
                mutable_data['condition'] = Listing.Condition.GOOD
        if 'category' in mutable_data and 'category_id' not in mutable_data:
            cat_val = mutable_data.get('category')
            if isinstance(cat_val, (int, str)) and str(cat_val).isdigit():
                mutable_data['category_id'] = int(cat_val)
                mutable_data.pop('category', None)
        return super().to_internal_value(mutable_data)

    def create(self, validated_data):
        image = validated_data.pop('image', None)
        request = self.context.get('request')
        seller = validated_data.pop('seller', None) or (request.user if request else None)
        if image:
            try:
                validated_data['image_url'] = upload_listing_image(image)
            except Exception as exc:
                logger.exception(
                    'Listing image upload failed after storage fallback for "%s".',
                    image.name,
                )
                raise serializers.ValidationError(
                    {'image': 'Image upload failed. Please try again.'}
                ) from exc
        return Listing.objects.create(seller=seller, **validated_data)

class ConversationSerializer(serializers.ModelSerializer):
    buyer = UserPublicSerializer(read_only=True)
    seller = UserPublicSerializer(read_only=True)
    buyer_id = serializers.IntegerField(source='buyer.id', read_only=True)
    seller_id = serializers.IntegerField(source='seller.id', read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        queryset=Listing.objects.all(), source='listing', write_only=True, required=False
    )
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'listing', 'listing_id', 'buyer', 'buyer_id', 'seller', 'seller_id', 'last_message', 'created_at']
        read_only_fields = ['id', 'buyer', 'buyer_id', 'seller', 'seller_id', 'created_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['listing'] = {
            'id': instance.listing.id,
            'title': instance.listing.title,
            'price': str(instance.listing.price),
            'condition': instance.listing.condition,
            'status': instance.listing.status,
            'image_url': instance.listing.image_url,
            'category': instance.listing.category.name if instance.listing.category else 'Uncategorized',
            'category_id': instance.listing.category.id if instance.listing.category else None,
            'seller_id': instance.listing.seller_id,
        }
        ret['listing_id'] = instance.listing.id
        return ret

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-timestamp').first()
        if last_msg:
            return {
                'id': last_msg.id,
                'sender_id': last_msg.sender_id,
                'sender_name': last_msg.sender.username,
                'text': last_msg.text,
                'timestamp': last_msg.timestamp,
            }
        return None

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'listing' in mutable_data and 'listing_id' not in mutable_data:
            list_val = mutable_data.get('listing')
            if isinstance(list_val, (int, str)) and str(list_val).isdigit():
                mutable_data['listing_id'] = int(list_val)
                mutable_data.pop('listing', None)
        return super().to_internal_value(mutable_data)

    def validate_listing(self, listing):
        user = self.context['request'].user
        if listing.seller_id == user.id:
            raise serializers.ValidationError('You cannot start a conversation with yourself.')
        return listing

class MessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)
    attachment = serializers.FileField(write_only=True, required=False)
    image_url = serializers.SerializerMethodField()
    media_type = serializers.ChoiceField(
        choices=Message.MediaType.choices,
        required=False,
        allow_blank=True,
    )
    conversation_id = serializers.PrimaryKeyRelatedField(
        queryset=Conversation.objects.all(), source='conversation', write_only=True, required=False
    )

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'conversation_id', 'sender', 'sender_id', 'text',
            'attachment', 'image_url', 'media_type', 'timestamp',
        ]
        read_only_fields = ['id', 'conversation', 'sender', 'sender_id', 'timestamp']

    def validate(self, attrs):
        attachment = attrs.get('attachment')
        if attachment:
            content_type = getattr(attachment, 'content_type', '') or ''
            if content_type.startswith('image/'):
                inferred_type = Message.MediaType.IMAGE
            elif content_type.startswith('video/'):
                inferred_type = Message.MediaType.VIDEO
            else:
                raise serializers.ValidationError({
                    'attachment': 'Only image and video attachments are supported.'
                })
            media_type = attrs.get('media_type')
            if media_type and media_type != inferred_type:
                raise serializers.ValidationError({
                    'media_type': 'The media type does not match the uploaded file.'
                })
            attrs['media_type'] = inferred_type
        return attrs

    def create(self, validated_data):
        attachment = validated_data.pop('attachment', None)
        if attachment:
            try:
                validated_data['image_url'] = upload_chat_attachment(attachment)
            except Exception as exc:
                logger.exception(
                    'Chat attachment upload failed after storage fallback for "%s".',
                    attachment.name,
                )
                raise serializers.ValidationError({
                    'attachment': 'Attachment upload failed. Please try again.'
                }) from exc
        return Message.objects.create(**validated_data)

    def get_image_url(self, obj):
        if not obj.image_url:
            return ''
        request = self.context.get('request')
        return request.build_absolute_uri(obj.image_url) if request else obj.image_url

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'conversation' in mutable_data and 'conversation_id' not in mutable_data:
            conv_val = mutable_data.get('conversation')
            if isinstance(conv_val, (int, str)) and str(conv_val).isdigit():
                mutable_data['conversation_id'] = int(conv_val)
                mutable_data.pop('conversation', None)
        return super().to_internal_value(mutable_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['conversation'] = instance.conversation_id
        ret['conversation_id'] = instance.conversation_id
        return ret

class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        source='listing', queryset=Listing.objects.all(), write_only=True,
    )

    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'listing_id']
        read_only_fields = ['id', 'listing']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'listing' in mutable_data and 'listing_id' not in mutable_data:
            l_val = mutable_data.get('listing')
            if isinstance(l_val, (int, str)) and str(l_val).isdigit():
                mutable_data['listing_id'] = int(l_val)
                mutable_data.pop('listing', None)
        return super().to_internal_value(mutable_data)


class EmailOTPRequestSerializer(serializers.Serializer):
    university_email = serializers.EmailField(validators=[CAMPUS_EMAIL_VALIDATOR])


class EmailOTPVerifySerializer(EmailOTPRequestSerializer):
    otp_code = serializers.RegexField(regex=r'^\d{6}$')


class RatingSerializer(serializers.ModelSerializer):
    rater = UserPublicSerializer(read_only=True)
    rated_user = UserPublicSerializer(read_only=True)
    conversation_id = serializers.IntegerField(source='conversation.id', read_only=True)

    class Meta:
        model = Rating
        fields = [
            'id', 'conversation_id', 'rater', 'rated_user', 'score', 'comment',
            'created_at',
        ]
        read_only_fields = ['id', 'conversation_id', 'rater', 'rated_user', 'created_at']

    def validate_score(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Score must be between 1 and 5.')
        return value

    def validate(self, attrs):
        request = self.context['request']
        conversation_id = request.data.get('conversation')
        try:
            conversation = Conversation.objects.select_related('listing').get(
                pk=int(conversation_id)
            )
        except (Conversation.DoesNotExist, TypeError, ValueError):
            raise serializers.ValidationError({'conversation': 'A valid conversation is required.'})

        if request.user not in (conversation.buyer, conversation.seller):
            raise serializers.ValidationError(
                {'conversation': 'Only conversation participants can leave a review.'}
            )
        if conversation.listing.status != Listing.Status.SOLD:
            raise serializers.ValidationError(
                {'conversation': 'A review can be left after the listing is sold.'}
            )
        if Rating.objects.filter(conversation=conversation, rater=request.user).exists():
            raise serializers.ValidationError(
                {'conversation': 'You have already reviewed this conversation.'}
            )
        attrs['conversation'] = conversation
        attrs['rated_user'] = (
            conversation.seller if request.user == conversation.buyer else conversation.buyer
        )
        return attrs

    def create(self, validated_data):
        return Rating.objects.create(rater=self.context['request'].user, **validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    conversation_id = serializers.IntegerField(read_only=True)
    message_id = serializers.IntegerField(read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    item_title = serializers.CharField(source='conversation.listing.title', read_only=True)
    preview_text = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'conversation_id', 'message_id', 'sender_id', 'sender_name',
            'item_title', 'preview_text', 'is_read', 'created_at',
        ]

    def get_preview_text(self, obj):
        if obj.message_id:
            return obj.message.text
        return 'Started a conversation about this listing.'