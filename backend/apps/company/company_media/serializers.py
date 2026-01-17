from rest_framework import serializers
from .models import CompanyMedia


class CompanyMediaSerializer(serializers.ModelSerializer):
    """ Serializer hiển thị thông tin media"""
    media_type_name = serializers.CharField(source='media_type.type_name', read_only=True)

    class Meta:
        model = CompanyMedia
        fields = [
            'id', 
            'company', 
            'media_type', 
            'media_type_name', 
            'media_url', 
            'thumbnail_url', 
            'title', 
            'caption', 
            'display_order', 
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CompanyMediaCreateSerializer(serializers.Serializer):
    """ Serializer xử lý upload media mới"""
    media_file = serializers.FileField(required=True)
    media_type_id = serializers.IntegerField(required=True)
    title = serializers.CharField(max_length=255, required=False, allow_blank=True)
    caption = serializers.CharField(required=False, allow_blank=True)
    display_order = serializers.IntegerField(required=False, default=0)


class CompanyMediaUpdateSerializer(serializers.ModelSerializer):
    """ Serializer cập nhật thông tin media"""
    class Meta:
        model = CompanyMedia
        fields = ['title', 'caption', 'display_order']


class MediaReorderItemSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    display_order = serializers.IntegerField()


class CompanyMediaReorderSerializer(serializers.Serializer):
    """ Serializer xử lý sắp xếp thứ tự media"""
    reorders = MediaReorderItemSerializer(many=True)


class CompanyMediaBulkUploadSerializer(serializers.Serializer):
    """ Serializer xử lý upload nhiều media"""
    media_files = serializers.ListField(
        child=serializers.FileField(),
        allow_empty=False
    )
    media_type_id = serializers.IntegerField(required=True)
