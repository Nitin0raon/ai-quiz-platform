"""
Common App - Custom Pagination
================================
Pagination breaks large result sets into pages.
Without pagination, an endpoint returning 10,000 records would be very slow.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Standard pagination for most list endpoints.

    Usage in URL: GET /api/v1/quizzes/?page=2&page_size=20

    Response format:
    {
        "count": 100,       // total items
        "total_pages": 10,
        "current_page": 2,
        "next": "http://...",
        "previous": "http://...",
        "results": [...]    // the actual data
    }
    """
    page_size = 10                   # Default: 10 items per page
    page_size_query_param = 'page_size'  # Allow client to set page size
    max_page_size = 100              # Maximum allowed page size

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })


class LargePagination(PageNumberPagination):
    """For endpoints that need larger page sizes (e.g., leaderboards)."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
