from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models

def validate_campus_email(value):
    allowed_domains = ['vitstudent.ac.in']
    domain = value.split('@')[-1]
    if not any(domain.endswith(d) for d in allowed_domains):
        raise ValidationError(f"Email domain '{domain}' is not authorized. Must be a valid campus email.")

class CustomUser(AbstractUser):
    university_email = models.EmailField(unique=True, validators=[validate_campus_email])
    hostel_building = models.CharField(max_length=50, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_verified_student = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.university_email})"


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Listing(models.Model):
    class Condition(models.TextChoices):
        NEW = 'New', 'New'
        LIKE_NEW = 'Like New', 'Like New'
        GOOD = 'Good', 'Good'
        FAIR = 'Fair', 'Fair'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        RESERVED = 'RESERVED', 'Reserved'
        SOLD = 'SOLD', 'Sold'

    seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='listings')
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name='listings')
    title = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=Condition.choices)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.AVAILABLE)
    image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Conversation(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='conversations')
    buyer = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='buyer_conversations')
    seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='seller_conversations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['listing', 'buyer'], name='unique_buyer_listing_conversation'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.buyer} - {self.listing}'


class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f'Message from {self.sender} in conversation {self.conversation_id}'


class Favorite(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='favorites')
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'listing'], name='unique_user_listing_favorite'),
        ]

    def __str__(self):
        return f'{self.user} favorited {self.listing}'