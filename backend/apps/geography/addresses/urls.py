from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AddressViewSet

router = DefaultRouter()
router.register(r'', AddressViewSet, basename='addresses')

app_name = 'addresses'

urlpatterns = [
    path('', include(router.urls)),
]
