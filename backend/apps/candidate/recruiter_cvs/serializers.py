from rest_framework import serializers
from .models import RecruiterCV
from apps.candidate.cv_templates.serializers import CVTemplateListSerializer


class RecruiterCVListSerializer(serializers.ModelSerializer):
    """
    Serializer cho danh sách CV
    """
    
    template_name = serializers.CharField(source='template.name', read_only=True, allow_null=True)
    
    class Meta:
        model = RecruiterCV
        fields = [
            'id', 'cv_name', 'template_id', 'template_name',
            'cv_url', 'is_default', 'is_public',
            'view_count', 'download_count', 'created_at', 'updated_at'
        ]


class RecruiterCVDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết CV
    """
    
    template = CVTemplateListSerializer(read_only=True)
    
    class Meta:
        model = RecruiterCV
        fields = [
            'id', 'cv_name', 'template', 'cv_data', 'cv_url',
            'is_default', 'is_public', 'view_count', 'download_count',
            'created_at', 'updated_at'
        ]


class RecruiterCVCreateSerializer(serializers.ModelSerializer):
    """
    Serializer cho tạo/cập nhật CV
    """
    
    template_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = RecruiterCV
        fields = [
            'id', 'cv_name', 'template_id', 'cv_data',
            'cv_url', 'is_default', 'is_public'
        ]
        read_only_fields = ['id']
    
    def validate_template_id(self, value):
        if value:
            from apps.candidate.cv_templates.models import CVTemplate
            if not CVTemplate.objects.filter(id=value, is_active=True).exists():
                raise serializers.ValidationError("Template không tồn tại!")
        return value
    
    def create(self, validated_data):
        template_id = validated_data.pop('template_id', None)
        if template_id:
            validated_data['template_id'] = template_id
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        template_id = validated_data.pop('template_id', None)
        if template_id is not None:
            instance.template_id = template_id
        return super().update(instance, validated_data)
