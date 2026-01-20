from rest_framework import serializers
from .models import JobLocation
from apps.geography.addresses.models import Address

class JobLocationSerializer(serializers.ModelSerializer):
    """
        Serializer cho đọc danh sách job locations
    """
    
    address_id = serializers.IntegerField(source='address.id', read_only=True)
    street = serializers.CharField(source='address.street', read_only=True, allow_null=True)
    province_name = serializers.CharField(source='address.province.name', read_only=True, allow_null=True)
    commune_name = serializers.CharField(source='address.commune.name', read_only=True, allow_null=True)
    
    class Meta:
        model = JobLocation
        fields = [
            'id', 'address_id', 'street',
            'province_name', 'commune_name',
            'is_primary', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class JobLocationCreateSerializer(serializers.Serializer):
    """
        Serializer cho tạo/cập nhật job location
    """
    
    address_id = serializers.IntegerField(required=True)
    is_primary = serializers.BooleanField(required=False, default=False)
    
    def validate_address_id(self, value):
        if not Address.objects.filter(id=value).exists():
            raise serializers.ValidationError("Address is not found!")
        return value
