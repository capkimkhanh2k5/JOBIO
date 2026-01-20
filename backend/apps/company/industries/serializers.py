from rest_framework import serializers
from .models import Industry


class IndustrySerializer(serializers.ModelSerializer):
    """
        Serializer cho Industry (CRUD)
    """
    
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Industry
        fields = [
            'id', 'name', 'slug', 'description', 'icon_url',
            'parent', 'parent_name', 'children_count',
            'is_active', 'display_order', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()


class IndustryTreeSerializer(serializers.ModelSerializer):
    """
        Serializer cho hierarchical tree (recursive)
    """
    
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = Industry
        fields = ['id', 'name', 'slug', 'icon_url', 'display_order', 'children']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('display_order', 'name')
        return IndustryTreeSerializer(children, many=True).data
