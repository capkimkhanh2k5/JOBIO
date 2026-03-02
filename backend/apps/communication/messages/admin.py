from django.contrib import admin
from apps.communication.messages.models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread', 'sender', 'content_preview', 'is_system_message', 'created_at']
    list_filter = ['is_system_message', 'created_at']
    search_fields = ['content', 'sender__full_name', 'sender__email']
    raw_id_fields = ['thread', 'sender']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']

    def content_preview(self, obj):
        return obj.content[:80] + '...' if len(obj.content) > 80 else obj.content
    content_preview.short_description = 'Content'
