from rest_framework import serializers
from .models import RecruiterSkill


class RecruiterSkillSerializer(serializers.ModelSerializer):
    """
    Serializer cho đọc dữ liệu (List/Detail)
    """

    skill_id = serializers.IntegerField(source="skill.id", read_only=True)
    skill_name = serializers.CharField(source="skill.name", read_only=True)

    class Meta:
        model = RecruiterSkill
        fields = [
            "id",
            "skill_id",
            "skill_name",
            "proficiency_level",
            "years_of_experience",
            "is_verified",
            "endorsement_count",
            "last_used_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_verified",
            "endorsement_count",
            "created_at",
            "updated_at",
        ]


class RecruiterSkillCreateSerializer(serializers.Serializer):
    """
    Serializer cho tạo mới skill
    """

    skill_id = serializers.IntegerField(required=False, allow_null=True)
    skill_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    proficiency_level = serializers.ChoiceField(
        choices=["basic", "intermediate", "advanced", "expert"],
        required=False,
        default="intermediate",
    )
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    last_used_date = serializers.DateField(required=False, allow_null=True)

    def validate(self, attrs):
        skill_name = (attrs.get("skill_name") or "").strip()
        if not attrs.get("skill_id") and not skill_name:
            raise serializers.ValidationError("Phải cung cấp skill_id hoặc skill_name")
        if skill_name:
            attrs["skill_name"] = skill_name
        return attrs


class RecruiterSkillUpdateSerializer(serializers.Serializer):
    """
    Serializer cho cập nhật skill (partial update)
    """

    proficiency_level = serializers.ChoiceField(
        choices=["basic", "intermediate", "advanced", "expert"], required=False
    )
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    last_used_date = serializers.DateField(required=False, allow_null=True)


class BulkAddSkillSerializer(serializers.Serializer):
    """
    Serializer cho bulk-add skills
    """

    skills = serializers.ListField(child=serializers.DictField(), required=True)

    def validate_skills(self, value):
        """
        Validate each skill item has skill_id or skill_name
        """
        for item in value:
            skill_name = (item.get("skill_name") or "").strip()
            if not item.get("skill_id") and not skill_name:
                raise serializers.ValidationError(
                    "Each skill must have 'skill_id' or 'skill_name' field"
                )
            if skill_name:
                item["skill_name"] = skill_name
        return value


class EndorseSkillSerializer(serializers.Serializer):
    """
    Serializer cho endorse skill
    """

    relationship = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
