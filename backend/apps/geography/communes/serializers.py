from rest_framework import serializers
from .models import Commune


class CommuneListSerializer(serializers.ModelSerializer):
    """
    Serializer cho list - thông tin cơ bản
    """
    
    class Meta:
        model = Commune
        fields = ['id', 'commune_name', 'commune_type', 'province']


class CommuneDetailSerializer(serializers.ModelSerializer):
    """
        Serializer cho retrieve - full detail với province info
    """
    province_name = serializers.CharField(source='province.province_name', read_only=True)
    commune_type_display = serializers.CharField(source='get_commune_type_display', read_only=True)
    
    class Meta:
        model = Commune
        fields = [
            'id', 'commune_name', 'commune_type', 'commune_type_display',
            'province', 'province_name', 'is_active', 'created_at'
        ]


class CommuneCreateUpdateSerializer(serializers.ModelSerializer):
    """
        Serializer cho POST/PUT - admin only
    """
    
    class Meta:
        model = Commune
        fields = ['commune_name', 'commune_type', 'province', 'is_active']
