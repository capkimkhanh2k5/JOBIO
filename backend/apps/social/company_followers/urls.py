from django.urls import path
from .views import CompanyFollowerViewSet

# Manual mapping for actions
follow_view = CompanyFollowerViewSet.as_view({'post': 'follow'})
unfollow_view = CompanyFollowerViewSet.as_view({'delete': 'unfollow'})
is_following_view = CompanyFollowerViewSet.as_view({'get': 'is_following'})
following_companies_view = CompanyFollowerViewSet.as_view({'get': 'following_companies'})

urlpatterns = [
    # Actions on specific company
    path('<int:pk>/follow/', follow_view, name='company-follow'),
    path('<int:pk>/unfollow/', unfollow_view, name='company-unfollow'),
    path('<int:pk>/is-following/', is_following_view, name='company-is-following'),
    
    # List following companies (me/following)
    path('following/', following_companies_view, name='company-following-list'),
]
