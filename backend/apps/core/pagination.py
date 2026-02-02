"""
Custom Pagination Classes cho Django REST Framework.

Cung cấp các class pagination chuẩn hóa cho toàn bộ API.
"""
from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response

class StandardResultsSetPagination(PageNumberPagination):
    """
    Pagination mặc định cho đa số endpoints.
    - page_size: 20 items/page
    - max: 100 items/page
    - Hỗ trợ query param: ?page=1&page_size=50
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })


class SmallResultsSetPagination(PageNumberPagination):
    """
    Pagination cho light-weight endpoints.
    - page_size: 10 items/page
    - max: 50 items/page
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class LargeResultsSetPagination(PageNumberPagination):
    """
    Pagination cho data-heavy endpoints (export, analytics).
    - page_size: 50 items/page
    - max: 500 items/page
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 500


class JobSearchPagination(PageNumberPagination):
    """
    Pagination cho Job Search với defaults phù hợp.
    - page_size: 20 jobs/page
    - max: 100 jobs/page
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'jobs': data  # Semantic naming
        })


class ApplicationPagination(PageNumberPagination):
    """
    Pagination cho Applications list.
    - page_size: 25 applications/page
    """
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class NotificationPagination(PageNumberPagination):
    """
    Pagination cho Notifications.
    - page_size: 15 notifications/page
    """
    page_size = 15
    page_size_query_param = 'page_size'
    max_page_size = 50


class MessagePagination(CursorPagination):
    """
    Cursor pagination cho Messages (infinite scroll).
    - page_size: 30 messages
    - Ordering: created_at DESC
    """
    page_size = 30
    ordering = '-created_at'
    cursor_query_param = 'cursor'


class ReviewPagination(PageNumberPagination):
    """
    Pagination cho Company Reviews.
    - page_size: 10 reviews/page
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class SearchHistoryPagination(PageNumberPagination):
    """
    Pagination cho Search History.
    - page_size: 20 items/page
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ActivityLogPagination(PageNumberPagination):
    """
    Pagination cho Activity Logs (Admin).
    - page_size: 50 logs/page
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200
