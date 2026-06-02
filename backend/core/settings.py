"""
AI Quiz Platform - Django Settings
====================================
This is the main settings file. Every important decision is explained.
"""

import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# ============================================================
# BASE DIRECTORY
# ============================================================
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file variables into the environment
load_dotenv(BASE_DIR / '.env')


# ============================================================
# SECURITY SETTINGS
# ============================================================
# SECRET_KEY: Used to sign cookies, CSRF tokens, sessions.
# NEVER hardcode this - always read from environment.
SECRET_KEY = os.getenv('SECRET_KEY', 'change-this-insecure-default-key')

# DEBUG: Set to False in production ALWAYS.
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# ALLOWED_HOSTS: Which domain names can access this server.
# ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

ALLOWED_HOSTS = os.getenv(
    'ALLOWED_HOSTS',
    'localhost,127.0.0.1'
).split(',')


# ============================================================
# INSTALLED APPS
# ============================================================
# Django apps are like plugins/modules.
# - django.* apps are built-in Django features
# - rest_framework is Django REST Framework (DRF)
# - Our apps are under apps/
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'cloudinary_storage',   # ← add this
    'cloudinary',           # ← add this
]

LOCAL_APPS = [
    'apps.users',        # Custom user model & auth
    'apps.documents',    # PDF uploads
    'apps.quizzes',      # Quiz generation & attempts
    'apps.rag',          # RAG pipeline
    'apps.analytics',    # Analytics & leaderboard
    'apps.common',      # Shared utilities
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ============================================================
# MIDDLEWARE
# ============================================================
# Middleware runs on every request/response like a pipeline.
# CorsMiddleware MUST be before CommonMiddleware.
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'corsheaders.middleware.CorsMiddleware',          # CORS - must be high up
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ============================================================
# URL CONFIGURATION
# ============================================================
ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# ============================================================
# DATABASE - PostgreSQL
# ============================================================
# We use PostgreSQL because it's production-grade.
# SQLite (Django default) is only for development/testing.
# All credentials come from .env - never hardcode passwords!
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': os.getenv('DB_NAME', 'ai_quiz_db'),
#         'USER': os.getenv('DB_USER', 'postgres'),
#         'PASSWORD': os.getenv('DB_PASSWORD', ''),
#         'HOST': os.getenv('DB_HOST', 'localhost'),
#         'PORT': os.getenv('DB_PORT', '5432'),
#         'OPTIONS': {
#             'connect_timeout': 10,
#         },
#     }
# }

import dj_database_url

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: use DATABASE_URL (Supabase/Railway/Render)
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Local development: use individual settings
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'ai_quiz_db'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }


# ============================================================
# CUSTOM USER MODEL
# ============================================================
# We replace Django's default User model with our own.
# This MUST be set BEFORE running first migration.
# Changing this later is very difficult.
AUTH_USER_MODEL = 'users.User'


# ============================================================
# PASSWORD VALIDATION
# ============================================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ============================================================
# INTERNATIONALIZATION
# ============================================================
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# ============================================================
# STATIC & MEDIA FILES
# ============================================================
# STATIC_URL = '/static/'
# STATIC_ROOT = BASE_DIR / 'staticfiles'

# ── STATIC FILES ─────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# # MEDIA: User-uploaded files (PDFs, etc.)
# MEDIA_URL = os.getenv('MEDIA_URL', '/media/')
# MEDIA_ROOT = BASE_DIR / os.getenv('MEDIA_ROOT', 'media')


# ── MEDIA FILES ───────────────────────────────────────────
# Local development: store locally
# Production: store on Cloudinary
CLOUDINARY_URL = os.getenv('CLOUDINARY_URL')

if CLOUDINARY_URL:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api

    cloudinary.config(from_url=CLOUDINARY_URL)

    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    MEDIA_URL = '/media/'
else:
    MEDIA_URL = os.getenv('MEDIA_URL', '/media/')
    MEDIA_ROOT = BASE_DIR / os.getenv('MEDIA_ROOT', 'media')

# ============================================================
# DEFAULT PRIMARY KEY
# ============================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ============================================================
# DJANGO REST FRAMEWORK SETTINGS
# ============================================================
# DRF is the toolkit for building REST APIs.
REST_FRAMEWORK = {
    # JWT is our default authentication method
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # By default, all endpoints require authentication
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Pagination: Return data in pages, not all at once
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    # Filtering support
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    # API Throttling: Prevent abuse
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',      # Anonymous users: 100 requests/day
        'user': '1000/day',     # Logged-in users: 1000 requests/day
    },
    # Standard error responses
    'EXCEPTION_HANDLER': 'apps.common.exceptions.custom_exception_handler',
}


# ============================================================
# JWT SETTINGS
# ============================================================
# JWT (JSON Web Token) is our authentication mechanism.
# access token: short-lived (60 min), used for API calls
# refresh token: long-lived (7 days), used to get new access tokens
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=int(os.getenv('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', 60))
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=int(os.getenv('JWT_REFRESH_TOKEN_LIFETIME_DAYS', 7))
    ),
    'ROTATE_REFRESH_TOKENS': True,        # Issue new refresh token on each refresh
    'BLACKLIST_AFTER_ROTATION': True,     # Invalidate old refresh token
    'UPDATE_LAST_LOGIN': True,            # Update user's last login on token issue
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),     # Authorization: Bearer <token>
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}


# ============================================================
# CORS SETTINGS
# ============================================================
# CORS allows your frontend (React, etc.) to call this API.
# Without this, browsers block cross-origin requests.
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True  # Allow cookies/auth headers


# ============================================================
# REDIS CACHE SETTINGS
# ============================================================
# Redis is an in-memory database used for caching.
# Caching speeds up repeated requests dramatically.
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'TIMEOUT': 300,  # Cache expires in 5 minutes by default
    }
}


# ============================================================
# LOGGING CONFIGURATION
# ============================================================
# Logging helps you debug and monitor your application.
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'app.log',
            'formatter': 'verbose',
        },
        'error_file': {
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'errors.log',
            'formatter': 'verbose',
            'level': 'ERROR',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': True,
        },
        'apps': {
            'handlers': ['console', 'file', 'error_file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}


# ============================================================
# FILE UPLOAD SETTINGS
# ============================================================
# Maximum upload size: 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024   # 10 MB

# Allowed file types for document upload
ALLOWED_DOCUMENT_TYPES = ['application/pdf']
MAX_DOCUMENT_SIZE_MB = 10


# # ============================================================
# # GOOGLE GEMINI API
# # ============================================================
# GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')

# ============================================================
# GROQ API (replaces Gemini for quiz generation)
# ============================================================
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')


# ============================================================
# FAISS VECTOR STORE
# ============================================================
# FAISS indexes are stored on disk for persistence
FAISS_INDEX_PATH = BASE_DIR / 'faiss_indexes'


# ── PRODUCTION SECURITY ───────────────────────────────────
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# ── CORS — update for production ──────────────────────────
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000'
).split(',')

CORS_ALLOW_CREDENTIALS = True