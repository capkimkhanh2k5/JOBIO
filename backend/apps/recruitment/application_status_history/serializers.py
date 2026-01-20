from rest_framework import serializers
from .models import ApplicationStatusHistory


class StatusHistorySerializer(serializers.ModelSerializer):
    """
        Serializer cho lịch sử thay đổi trạng thái
    """
    
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    
    class Meta:
        model = ApplicationStatusHistory
        fields = [
            'id', 'old_status', 'new_status',
            'changed_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
