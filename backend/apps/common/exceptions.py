"""
Common App - Custom Exception Handler
=======================================
This replaces DRF's default exception handler with one that returns
consistent, clean error responses across all API endpoints.

Standard error response format:
{
    "success": false,
    "message": "Human-readable error message",
    "errors": { ... }  // optional field-level errors
}
"""

import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('apps')


def custom_exception_handler(exc, context):
    """
    Custom exception handler for consistent API error responses.
    Called by DRF when any exception is raised in a view.
    """
    # Call DRF's default handler first to get a Response object
    response = exception_handler(exc, context)

    if response is not None:
        # DRF handled the exception (e.g. ValidationError, AuthenticationFailed)
        error_data = {
            'success': False,
            'message': _get_error_message(response.data),
            'errors': response.data if isinstance(response.data, dict) else None,
            'status_code': response.status_code,
        }
        response.data = error_data
    else:
        # Unhandled exception - server error
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        response = Response({
            'success': False,
            'message': 'An internal server error occurred. Please try again later.',
            'status_code': 500,
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response


def _get_error_message(data):
    """Extract a human-readable message from error data."""
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return data[0] if data else 'An error occurred.'
    if isinstance(data, dict):
        # Try common keys
        for key in ['detail', 'message', 'non_field_errors']:
            if key in data:
                val = data[key]
                if isinstance(val, list):
                    return str(val[0])
                return str(val)
        # Return the first field's error
        first_key = next(iter(data))
        val = data[first_key]
        if isinstance(val, list):
            return f"{first_key}: {val[0]}"
        return f"{first_key}: {val}"
    return 'An error occurred.'
