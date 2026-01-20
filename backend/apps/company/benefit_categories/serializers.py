from rest_framework import serializers
from .models import BenefitCategory


class BenefitCategorySerializer(serializers.ModelSerializer):
    """Serializer cho list, detail, create, update"""
    
    class Meta:
        model = BenefitCategory
        fields = [
            'id', 'name', 'slug', 'icon_url', 
            'is_active', 'display_order', 'created_at'
        ]
        read_only_fields = ['created_at']


class BenefitCategoryListSerializer(serializers.ModelSerializer):
    """Serializer minimal cho list response"""
    
    class Meta:
        model = BenefitCategory
        fields = ['id', 'name', 'slug', 'icon_url', 'display_order']


class ReorderItemSerializer(serializers.Serializer):
    """Serializer cho từng item trong reorder request"""
    id = serializers.IntegerField()
    display_order = serializers.IntegerField()


class ReorderSerializer(serializers.Serializer):
    """Serializer cho reorder request"""
    items = ReorderItemSerializer(many=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("Items list cannot be empty")
        
        # Check for duplicate IDs
        ids = [item['id'] for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError("Duplicate IDs found")
        
        return value
