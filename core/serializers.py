from rest_framework import serializers
from .models import Category, Conversation, CustomUser, Favorite, Listing, Message
from .utils import upload_listing_image

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'university_email', 'password', 'hostel_building', 'graduation_year', 'phone_number']

    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['university_email'],
            university_email=validated_data['university_email'],
            password=validated_data['password'],
            hostel_building=validated_data.get('hostel_building', ''),
            graduation_year=validated_data.get('graduation_year'),
            phone_number=validated_data.get('phone_number', ''),
        )
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'university_email', 'hostel_building', 'graduation_year', 'phone_number', 'is_verified_student']
        read_only_fields = ['id', 'university_email', 'is_verified_student']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class ListingSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(write_only=True, required=False)
    seller = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            'id', 'seller', 'category', 'title', 'description', 'price',
            'condition', 'status', 'image_url', 'image', 'created_at',
        ]
        read_only_fields = ['id', 'seller', 'image_url', 'created_at']

    def create(self, validated_data):
        image = validated_data.pop('image', None)
        request = self.context.get('request')
        listing = Listing(seller=request.user, **validated_data)
        if image:
            listing.image_url = upload_listing_image(image)
        listing.save()
        return listing


class ConversationSerializer(serializers.ModelSerializer):
    buyer = serializers.PrimaryKeyRelatedField(read_only=True)
    seller = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Conversation
        fields = ['id', 'listing', 'buyer', 'seller', 'created_at']
        read_only_fields = ['id', 'buyer', 'seller', 'created_at']

    def validate_listing(self, listing):
        user = self.context['request'].user
        if listing.seller_id == user.id:
            raise serializers.ValidationError('You cannot start a conversation with yourself.')
        if Conversation.objects.filter(listing=listing, buyer=user).exists():
            raise serializers.ValidationError('You already have a conversation for this listing.')
        return listing


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'text', 'timestamp']
        read_only_fields = ['id', 'sender', 'timestamp']


class FavoriteSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        source='listing', queryset=Listing.objects.all(), write_only=True,
    )

    class Meta:
        model = Favorite
        fields = ['id', 'listing', 'listing_id']
        read_only_fields = ['id', 'listing']