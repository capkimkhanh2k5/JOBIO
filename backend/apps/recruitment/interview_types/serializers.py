from rest_framework import serializers
from .models import InterviewType


class InterviewTypeSerializer(serializers.ModelSerializer):
    """
        Serializer cho InterviewType
    """
    
    class Meta:
        model = InterviewType
        fields = [
            'id', 'name', 'description', 'icon_url', 
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
