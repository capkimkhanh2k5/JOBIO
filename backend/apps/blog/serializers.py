from rest_framework import serializers
from apps.blog.models import Post, Category, Tag

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug']

class PostSerializer(serializers.ModelSerializer):
    author = serializers.IntegerField(source='author_id', read_only=True)
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False, allow_null=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), source='tags', write_only=True, many=True, required=False
    )
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'author', 'author_name', 'author_avatar', 
            'category', 'category_id', 'tags', 'tag_ids', 
            'summary', 'content', 'thumbnail', 'is_featured',
            'meta_title', 'meta_description',
            'status', 'published_at', 'updated_at', 'view_count', 'created_at'
        ]
        read_only_fields = ['author', 'published_at', 'view_count', 'slug', 'updated_at']

    def get_author_name(self, obj):
        if not obj.author:
            return ''

        return (
            getattr(obj.author, 'full_name', None)
            or obj.author.get_full_name()
            or obj.author.email
        )

    def get_author_avatar(self, obj):
        if not obj.author:
            return None

        return getattr(obj.author, 'avatar_url', None)
