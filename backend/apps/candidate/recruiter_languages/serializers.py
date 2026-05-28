from rest_framework import serializers
from .models import RecruiterLanguage


class RecruiterLanguageSerializer(serializers.ModelSerializer):
    """
    Serializer cho đọc dữ liệu (List/Detail)
    """

    language_id = serializers.IntegerField(source="language.id", read_only=True)
    language_code = serializers.CharField(
        source="language.language_code", read_only=True
    )
    language_name = serializers.CharField(
        source="language.language_name", read_only=True
    )

    class Meta:
        model = RecruiterLanguage
        fields = [
            "id",
            "language_id",
            "language_code",
            "language_name",
            "proficiency_level",
            "is_native",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class RecruiterLanguageCreateSerializer(serializers.Serializer):
    """
    Serializer cho tạo mới ngôn ngữ
    """

    language_id = serializers.IntegerField(required=False, allow_null=True)
    language_name = serializers.CharField(
        required=False, allow_blank=True, max_length=50
    )
    proficiency_level = serializers.ChoiceField(
        choices=["native", "fluent", "advanced", "intermediate", "basic"],
        required=False,
        default="intermediate",
    )
    is_native = serializers.BooleanField(required=False, default=False)

    def validate(self, attrs):
        language_name = (attrs.get("language_name") or "").strip()
        if not attrs.get("language_id") and not language_name:
            raise serializers.ValidationError(
                "Phải cung cấp language_id hoặc language_name"
            )
        if language_name:
            attrs["language_name"] = language_name

        # Nếu proficiency_level = 'native' thì is_native = True
        if attrs.get("proficiency_level") == "native":
            attrs["is_native"] = True
        return attrs


class RecruiterLanguageUpdateSerializer(serializers.Serializer):
    """
    Serializer cho cập nhật ngôn ngữ (không cho update language_id)
    """

    proficiency_level = serializers.ChoiceField(
        choices=["basic", "intermediate", "advanced", "fluent", "native"],
        required=False,
    )
    is_native = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if attrs.get("proficiency_level") == "native":
            attrs["is_native"] = True
        return attrs
