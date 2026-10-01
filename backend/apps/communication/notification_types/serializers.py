from rest_framework import serializers

from .models import NotificationType


class NotificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationType
        fields = [
            "id",
            "type_name",
            "description",
            "template",
            "is_active",
            "created_at",
            "updated_at",
        ]
