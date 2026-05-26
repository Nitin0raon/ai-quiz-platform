"""
Users App - Views
==================
Views handle incoming HTTP requests and return responses.

We use class-based views (CBVs) because they:
- Are more organized than function-based views
- Follow DRY principle with inheritance
- Work great with DRF's generics

APIView: The base class for all DRF views.
generics.RetrieveUpdateAPIView: For GET + PATCH/PUT endpoints.
"""

import logging
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .models import User
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
)

logger = logging.getLogger('apps.users')


def get_tokens_for_user(user):
    """
    Generate JWT access and refresh tokens for a user.

    JWT Flow:
    1. User logs in -> Server creates access token + refresh token
    2. Client stores tokens (usually in localStorage or memory)
    3. Client sends access token in every request header: Authorization: Bearer <token>
    4. When access token expires, client uses refresh token to get a new one
    5. Logout = blacklist the refresh token
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Register a new user account.
    AllowAny: No authentication needed to register.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)

            logger.info(f"New user registered: {user.email}")

            return Response({
                'message': 'Account created successfully. Welcome!',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'full_name': user.full_name,
                },
                'tokens': tokens,
            }, status=status.HTTP_201_CREATED)

        return Response({
            'message': 'Registration failed. Please check your input.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticate user and return JWT tokens.
    AllowAny: No authentication needed to login.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)

            logger.info(f"User logged in: {user.email}")

            return Response({
                'message': 'Login successful.',
                'user': {
                    'id': str(user.id),
                    'email': user.email,
                    'username': user.username,
                    'full_name': user.full_name,
                },
                'tokens': tokens,
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Login failed.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklist the refresh token to invalidate it.
    This is how JWT "logout" works - we can't delete the access token
    since it's stateless, but we blacklist the refresh token so no new
    access tokens can be issued.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response({
                    'message': 'Refresh token is required for logout.'
                }, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()  # Add to blacklist - this token is now invalid

            logger.info(f"User logged out: {request.user.email}")

            return Response({
                'message': 'Logged out successfully.'
            }, status=status.HTTP_200_OK)

        except TokenError:
            return Response({
                'message': 'Invalid or already expired token.'
            }, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/v1/auth/profile/  -> Get current user's profile
    PATCH /api/v1/auth/profile/ -> Update profile fields
    IsAuthenticated: Only logged-in users can access.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Return the currently authenticated user."""
        return self.request.user

    def update(self, request, *args, **kwargs):
        # partial=True allows PATCH (partial updates) - only send what you want to change
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    Change authenticated user's password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            logger.info(f"Password changed for user: {request.user.email}")
            return Response({
                'message': 'Password changed successfully. Please log in again.'
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Password change failed.',
            'errors': serializer.errors,
        }, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenRefreshView(TokenRefreshView):
    """
    POST /api/v1/auth/token/refresh/
    Get a new access token using a valid refresh token.
    This extends the built-in SimpleJWT view with better error messages.
    """

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        return Response({
            'message': 'Token refreshed successfully.',
            'access': serializer.validated_data['access'],
        }, status=status.HTTP_200_OK)
