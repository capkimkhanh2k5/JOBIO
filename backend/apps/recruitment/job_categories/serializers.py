from rest_framework import serializers
from .models import JobCategory


class JobCategorySerializer(serializers.ModelSerializer):
    """
        Serializer cho JobCategory (CRUD)
    """
    
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobCategory
        fields = [
            'id', 'name', 'slug', 'description', 'icon_url',
            'parent', 'parent_name', 'children_count',
            'is_active', 'display_order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()


class JobCategoryTreeSerializer(serializers.ModelSerializer):
    """
        Serializer cho hierarchical tree (recursive)
    """
    
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = JobCategory
        fields = ['id', 'name', 'slug', 'icon_url', 'display_order', 'children']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('display_order', 'name')
        return JobCategoryTreeSerializer(children, many=True).data
