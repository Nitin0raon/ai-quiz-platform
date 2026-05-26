"""
Users App - Serializers
========================
Serializers convert complex data types (like Django models) to Python
native datatypes (dicts) that can be rendered into JSON.

Think of serializers as:
- INPUT: Validate and clean incoming JSON data
- OUTPUT: Convert model instances to JSON for response

DRF has two main serializer types:
- Serializer: Manual field definitions
- ModelSerializer: Auto-generates fields from a Model. We use this mostly.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Validates and creates a new user account.
    """

    # write_only=True: password is accepted in input but never returned in response
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],  # Uses Django's password validators
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'password', 'password_confirm'
        ]
        read_only_fields = ['id']

    def validate_email(self, value):
        """Check email is not already registered."""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate(self, attrs):
        """Cross-field validation: ensure passwords match."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs

    def create(self, validated_data):
        """
        Create and return a new user.
        We use create_user() which properly hashes the password.
        NEVER store plain-text passwords!
        """
        # Remove password_confirm - it's not a model field
        validated_data.pop('password_confirm')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Validates credentials and returns the authenticated user.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        email = attrs.get('email', '').lower()
        password = attrs.get('password', '')

        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")

        # authenticate() checks credentials against the database
        # It returns None if credentials are invalid
        user = authenticate(
            request=self.context.get('request'),
            username=email,  # Our USERNAME_FIELD is email
            password=password
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid email or password. Please try again."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This account has been deactivated. Contact support."
            )

        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for reading/updating user profile.
    Returns safe user data (no passwords).
    """
    full_name = serializers.ReadOnlyField()  # Computed property from model

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name', 'full_name',
            'bio', 'avatar',
            'total_points', 'streak_days',
            'last_quiz_date', 'date_joined', 'last_login',
        ]
        # These fields cannot be changed via this serializer
        read_only_fields = [
            'id', 'email', 'total_points', 'streak_days',
            'last_quiz_date', 'date_joined', 'last_login'
        ]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password_confirm = serializers.CharField(required=True, write_only=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': "New passwords do not match."
            })
        return attrs

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
