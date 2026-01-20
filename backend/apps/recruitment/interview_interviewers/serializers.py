from rest_framework import serializers
from .models import InterviewInterviewer

from apps.core.users.models import CustomUser

class InterviewerListSerializer(serializers.ModelSerializer):
    """
        Serializer cho danh sách người phỏng vấn
    """
    
    user_id = serializers.IntegerField(source='interviewer.id', read_only=True)
    name = serializers.CharField(source='interviewer.full_name', read_only=True)
    email = serializers.CharField(source='interviewer.email', read_only=True)
    
    class Meta:
        model = InterviewInterviewer
        fields = ['id', 'user_id', 'name', 'email', 'role', 'feedback', 'rating', 'created_at']


class InterviewerAddSerializer(serializers.Serializer):
    """
        Serializer cho thêm người phỏng vấn
    """
    
    user_id = serializers.IntegerField(required=True)
    role = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    def validate_user_id(self, value):
        if not CustomUser.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found!")
        return value


class InterviewerFeedbackSerializer(serializers.Serializer):
    """
        Serializer cho feedback của interviewer
    """
    
    feedback = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    rating = serializers.IntegerField(required=False, min_value=1, max_value=5)
    
    def validate(self, data):
        if not data.get('feedback') and not data.get('rating'):
            raise serializers.ValidationError("Feedback or rating is required!")
        return data
