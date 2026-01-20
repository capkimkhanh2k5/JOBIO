from rest_framework import serializers
from .models import Province


class ProvinceListSerializer(serializers.ModelSerializer):
    """Serializer cho list, search, by-region"""
    
    class Meta:
        model = Province
        fields = ['id', 'province_code', 'province_name', 'province_type', 'region']


class ProvinceDetailSerializer(serializers.ModelSerializer):
    """Serializer cho retrieve - full detail"""
    province_type_display = serializers.CharField(source='get_province_type_display', read_only=True)
    region_display = serializers.CharField(source='get_region_display', read_only=True)
    
    class Meta:
        model = Province
        fields = [
            'id', 'province_code', 'province_name', 
            'province_type', 'province_type_display',
            'region', 'region_display', 
            'is_active', 'created_at'
        ]
