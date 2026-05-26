"""
AI Quiz Platform - Root URL Configuration
==========================================
This is the entry point for all URL routing.
All API routes are versioned under /api/v1/
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def health_check(request):
    """Simple health check endpoint to verify the server is running."""
    return JsonResponse({
        'status': 'healthy',
        'message': 'AI Quiz Platform API is running',
        'version': 'v1',
    })


urlpatterns = [
    # Admin Panel
    path('admin/', admin.site.urls),

    # Health Check
    path('', health_check, name='health-check'),
    path('health/', health_check, name='health'),

    # API v1 Routes - all APIs are under /api/v1/
    path('api/v1/auth/', include('apps.users.urls', namespace='users')),
    path('api/v1/documents/', include('apps.documents.urls', namespace='documents')),
    path('api/v1/quizzes/', include('apps.quizzes.urls', namespace='quizzes')),
    path('api/v1/analytics/', include('apps.analytics.urls', namespace='analytics')),
    path('api/v1/rag/', include('apps.rag.urls', namespace='rag')),
]

# Serve media files during development
# In production, use Nginx/Apache to serve media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
