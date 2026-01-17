from django.urls import path
from .views import CompanyMediaViewSet

# Vì đây là nested routes (/api/companies/:id/media), chúng ta map thủ công ViewSet action
# thay vì dùng Router (trừ khi dùng drf-nested-routers).
# Tuân thủ Rule 2.3 Nested URLs

company_media_list = CompanyMediaViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

company_media_detail = CompanyMediaViewSet.as_view({
    'put': 'update',
    'delete': 'destroy'
})

company_media_reorder = CompanyMediaViewSet.as_view({
    'patch': 'reorder'
})

company_media_bulk_upload = CompanyMediaViewSet.as_view({
    'post': 'bulk_upload'
})

urlpatterns = [
    path('<int:company_id>/media', company_media_list, name='company-media-list'),
    path('<int:company_id>/media/<int:pk>', company_media_detail, name='company-media-detail'),
    path('<int:company_id>/media/reorder', company_media_reorder, name='company-media-reorder'),
    path('<int:company_id>/media/bulk-upload', company_media_bulk_upload, name='company-media-bulk-upload'),
]
