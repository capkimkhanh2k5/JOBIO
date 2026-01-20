from rest_framework import serializers
from .models import Address


class AddressListSerializer(serializers.ModelSerializer):
    """
        Serializer cho list - thông tin cơ bản
    """
    
    class Meta:
        model = Address
        fields = ['id', 'address_line', 'province', 'commune', 'is_verified']


class AddressDetailSerializer(serializers.ModelSerializer):
    """
    Serializer cho retrieve - full detail với nested info
    """
    province_name = serializers.CharField(source='province.province_name', read_only=True)
    commune_name = serializers.CharField(source='commune.commune_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Address
        fields = [
            'id', 'address_line', 'commune', 'commune_name',
            'province', 'province_name', 'latitude', 'longitude',
            'is_verified', 'created_at', 'updated_at'
        ]


class AddressCreateUpdateSerializer(serializers.ModelSerializer):
    """
        Serializer cho POST/PUT
    """
    
    class Meta:
        model = Address
        fields = ['address_line', 'commune', 'province', 'latitude', 'longitude']
