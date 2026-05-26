"""
Users App - Models
==================
We extend Django's AbstractUser to add our own fields.

WHY custom User model?
- Django's default User doesn't have fields like bio, avatar, etc.
- Changing the User model AFTER first migration is very painful.
- Always set AUTH_USER_MODEL before running first migration.

AbstractUser vs AbstractBaseUser:
- AbstractUser: Keeps all default fields (username, email, etc.) + lets you add more. EASIER.
- AbstractBaseUser: Starts from scratch. More control, much harder.
- We use AbstractUser for simplicity.
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model.

    Inherits from AbstractUser which already has:
    - username, email, first_name, last_name
    - password (hashed)
    - is_active, is_staff, is_superuser
    - date_joined, last_login

    We ADD:
    - id: UUID instead of integer (more secure, globally unique)
    - bio: Short user description
    - avatar: Profile picture
    - total_points: Gamification score
    - streak_days: How many consecutive days they've quizzed
    """

    # UUID primary key - harder to guess than sequential integers
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for this user"
    )

    # Make email required and unique (for login by email)
    email = models.EmailField(
        unique=True,
        help_text="User's email address (used for login)"
    )

    bio = models.TextField(
        blank=True,
        null=True,
        max_length=500,
        help_text="Short user biography"
    )

    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        help_text="Profile picture"
    )

    total_points = models.IntegerField(
        default=0,
        help_text="Total points earned from quizzes"
    )

    streak_days = models.IntegerField(
        default=0,
        help_text="Consecutive days of quiz activity"
    )

    last_quiz_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date of last quiz attempt"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Use email as the login field instead of username
    USERNAME_FIELD = 'email'
    # username is still required when creating superuser via command line
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} ({self.username})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username
