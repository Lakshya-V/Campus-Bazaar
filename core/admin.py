from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

# Register your models here.

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'university_email', 'hostel_building', 'is_verified_student', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Campus Details', {'fields': ('university_email', 'hostel_building', 'graduation_year', 'phone_number', 'is_verified_student')}),
    )