from rest_framework import serializers
from .models import JobSkill


class JobSkillSerializer(serializers.ModelSerializer):
    """
        Serializer cho đọc danh sách job skills
    """
    
    skill_id = serializers.IntegerField(source='skill.id', read_only=True)
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    
    class Meta:
        model = JobSkill
        fields = [
            'id', 'skill_id', 'skill_name',
            'is_required', 'proficiency_level', 'years_required',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class JobSkillCreateSerializer(serializers.Serializer):
    """
        Serializer cho tạo/cập nhật job skill
    """
    
    skill_id = serializers.IntegerField(required=True)
    is_required = serializers.BooleanField(required=False, default=True)
    proficiency_level = serializers.ChoiceField(
        choices=['basic', 'intermediate', 'advanced', 'expert'],
        required=False,
        allow_null=True
    )
    years_required = serializers.IntegerField(required=False, allow_null=True)
    
    def validate_skill_id(self, value):
        from apps.candidate.skills.models import Skill
        if not Skill.objects.filter(id=value).exists():
            raise serializers.ValidationError("Skill is not exist!")
        return value
