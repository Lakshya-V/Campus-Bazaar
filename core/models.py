from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Avg

def validate_campus_email(value):
    domain = value.rsplit('@', 1)[-1].lower()
    if domain != 'vitstudent.ac.in':
        raise ValidationError(f"Email domain '{domain}' is not authorized. Must be a valid campus email.")

class CustomUser(AbstractUser):
    university_email = models.EmailField(unique=True, validators=[validate_campus_email])
    hostel_building = models.CharField(max_length=50, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_verified_student = models.BooleanField(default=False)
    password_reset_code_hash = models.CharField(max_length=255, null=True, blank=True)
    password_reset_attempts = models.IntegerField(default=0)
    password_reset_expires_at = models.DateTimeField(null=True, blank=True)
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_created_at = models.DateTimeField(null=True, blank=True)

    @property
    def rating_average(self):
        if self.received_reviews.exists():
            avg = self.received_reviews.aggregate(average=Avg('score'))['average']
            return round(avg, 1) if avg is not None else 0
        if self.received_buyer_reviews.exists():
            avg = self.received_buyer_reviews.aggregate(average=Avg('rating'))['average']
            return round(avg, 1) if avg is not None else 0
        return 0

    @property
    def rating_count(self):
        cnt = self.received_reviews.count()
        if cnt > 0:
            return cnt
        return self.received_buyer_reviews.count()

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
    CATEGORY_CHOICES = [
        ('books', 'Books'),
        ('electronics', 'Electronics'),
        ('cycles', 'Cycles'),
        ('clothing', 'Clothing'),
        ('hostel', 'Hostel Essentials'),
        ('others', 'Others'),
    ]

    CONDITION_CHOICES = [
        ('new', 'New'),
        ('like_new', 'Like New'),
        ('good', 'Good'),
        ('fair', 'Fair'),
        ('used', 'Used'),
    ]

    class Condition(models.TextChoices):
        NEW = 'new', 'New'
        LIKE_NEW = 'like_new', 'Like New'
        GOOD = 'good', 'Good'
        FAIR = 'fair', 'Fair'
        USED = 'used', 'Used'

    class Status(models.TextChoices):
        AVAILABLE = 'AVAILABLE', 'Available'
        SOLD = 'SOLD', 'Sold'

    seller = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='listings')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='listings')
    title = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.AVAILABLE)
    image_url = models.URLField(blank=True)
    views_count = models.PositiveIntegerField(default=0)
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
    class MediaType(models.TextChoices):
        IMAGE = 'image', 'Image'
        VIDEO = 'video', 'Video'

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='sent_messages')
    text = models.TextField()
    image_url = models.URLField(blank=True)
    media_type = models.CharField(max_length=5, choices=MediaType.choices, blank=True)
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


class Rating(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='ratings'
    )
    rater = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='given_reviews'
    )
    rated_user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='received_reviews'
    )
    score = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['conversation', 'rater'],
                name='unique_conversation_rater_review',
            ),
            models.CheckConstraint(
                condition=models.Q(score__gte=1, score__lte=5),
                name='rating_score_between_one_and_five',
            ),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.rater} rated {self.rated_user}: {self.score}/5'


class Review(models.Model):
    buyer = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='buyer_reviews'
    )
    seller = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='received_buyer_reviews'
    )
    listing = models.ForeignKey(
        Listing, on_delete=models.CASCADE, related_name='reviews', null=True, blank=True
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=models.Q(rating__gte=1, rating__lte=5),
                name='review_rating_between_one_and_five',
            ),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.buyer} reviewed {self.seller}: {self.rating}/5'


class Notification(models.Model):
    recipient = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='notifications'
    )
    sender = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name='sent_notifications'
    )
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name='notifications'
    )
    message = models.ForeignKey(
        Message, on_delete=models.CASCADE, related_name='notifications',
        null=True, blank=True,
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Notification for {self.recipient} from {self.sender}'