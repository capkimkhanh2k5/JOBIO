from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import models

from apps.blog.models import Post, Category, Tag
from apps.blog.serializers import PostSerializer, CategorySerializer, TagSerializer
from apps.core.permissions import IsAdminOrReadOnly
from apps.blog.services import BlogService
from apps.blog.selectors import BlogSelector

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = 'slug'

class PostViewSet(viewsets.ModelViewSet):
    serializer_class = PostSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'summary', 'content', 'tags__name', 'category__name']
    ordering_fields = ['published_at', 'view_count', 'created_at']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'view_count']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Post.objects.all()
        
        # Apply is_featured filter if provided
        is_featured = self.request.query_params.get('is_featured')
        if is_featured:
            is_featured_bool = is_featured.lower() == 'true'
            qs = qs.filter(is_featured=is_featured_bool)

        category_id = self.request.query_params.get('category_id')
        if category_id:
            qs = qs.filter(category_id=category_id)

        tag_id = self.request.query_params.get('tag_id')
        if tag_id:
            qs = qs.filter(tags__id=tag_id).distinct()

        if user.is_authenticated:
            # Staff sees all (with optional feature filter)
            if user.is_staff:
                return qs
            # Regular user sees enabled public posts AND their own posts
            return qs.filter(
                models.Q(status=Post.Status.PUBLISHED) | 
                models.Q(author=user)
            ).distinct()
            
        # Unauthenticated users only see published posts
        return qs.filter(status=Post.Status.PUBLISHED)

    def perform_create(self, serializer):
        user = self.request.user
        company = None
        
        # Get status from serializer or default to DRAFT
        status_val = serializer.validated_data.get('status', Post.Status.DRAFT)
        
        # Determine Company
        company_profile = getattr(user, 'company_profile', None)
        if company_profile:
            company = company_profile
        else:
            recruiter_profile = getattr(user, 'recruiter_profile', None)
            if recruiter_profile:
                company = recruiter_profile.current_company
                
        # If Admin, they can force status or it defaults to PUBLISHED if not specified
        if user.is_staff and 'status' not in serializer.validated_data:
            status_val = Post.Status.PUBLISHED
            
        serializer.save(
            author=user,
            company=company,
            status=status_val
        )

    @action(detail=False, methods=['get'], url_path='my-posts', permission_classes=[IsAuthenticated])
    def my_posts(self, request):
        user = request.user
        qs = Post.objects.filter(author=user)
        
        # Reuse filters
        search = request.query_params.get('search')
        if search:
            qs = qs.filter(
                models.Q(title__icontains=search) | 
                models.Q(summary__icontains=search) |
                models.Q(content__icontains=search)
            )
            
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, slug=None):
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
            
        post = self.get_object()
        BlogService.publish_post(post)
        return Response({'status': 'published', 'published_at': post.published_at})

    @action(detail=True, methods=['post'], url_path='view', permission_classes=[AllowAny])
    def view_count(self, request, slug=None):
        post = self.get_object()
        new_count = BlogService.increment_view_count(post)
        return Response({'view_count': new_count})

    @action(detail=False, methods=['get'], url_path='admin-stats')
    def admin_stats(self, request):
        """GET /api/blog/posts/admin-stats/ - Thống kê blog cho Admin"""
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Sum
        total = Post.objects.count()
        published = Post.objects.filter(status=Post.Status.PUBLISHED).count()
        draft = Post.objects.filter(status=Post.Status.DRAFT).count()
        total_views = Post.objects.aggregate(total=Sum('view_count'))['total'] or 0
        return Response({
            'total_posts': total,
            'published_posts': published,
            'draft_posts': draft,
            'total_views': total_views,
        })

    @action(detail=True, methods=['post'], url_path='upload-thumbnail',
            parser_classes=[__import__('rest_framework').parsers.MultiPartParser,
                            __import__('rest_framework').parsers.FormParser])
    def upload_thumbnail(self, request, slug=None):
        """POST /api/blog/posts/:slug/upload-thumbnail/ - Upload thumbnail lên Cloudinary"""
        post = self.get_object()
        if request.user != post.author and not request.user.is_staff:
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('thumbnail')
        if not file:
            return Response({'detail': 'Vui lòng cung cấp file thumbnail.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if file.content_type not in allowed_types:
            return Response({'detail': 'Chỉ chấp nhận JPEG, PNG, WEBP, GIF.'}, status=status.HTTP_400_BAD_REQUEST)

        if file.size > 5 * 1024 * 1024:
            return Response({'detail': 'File quá lớn. Tối đa 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            import time
            import cloudinary.uploader
            public_id = f"Jobio/Blog/Thumbnails/{post.id}/thumbnail_{int(time.time())}"
            result = cloudinary.uploader.upload(file, public_id=public_id, resource_type='image', overwrite=True)
            post.thumbnail = result['secure_url']
            post.save(update_fields=['thumbnail'])
            return Response({'thumbnail_url': post.thumbnail})
        except Exception as e:
            return Response({'detail': f'Upload thất bại: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

