from django.db import models


class Message(models.Model):
    """Bảng Messages - Tin nhắn trong cuộc hội thoại"""

    thread = models.ForeignKey(
        'communication_message_threads.MessageThread',
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True,
        verbose_name='Chuỗi tin nhắn'
    )
    sender = models.ForeignKey(
        'core_users.CustomUser',
        on_delete=models.CASCADE,
        related_name='sent_messages',
        db_index=True,
        verbose_name='Người gửi'
    )
    content = models.TextField(
        verbose_name='Nội dung'
    )
    attachments = models.JSONField(
        default=list,
        blank=True,
        verbose_name='Tệp đính kèm'
    )
    is_system_message = models.BooleanField(
        default=False,
        verbose_name='Tin nhắn hệ thống'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        verbose_name='Ngày tạo'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Ngày cập nhật'
    )

    class Meta:
        db_table = 'messages'
        verbose_name = 'Tin nhắn'
        verbose_name_plural = 'Tin nhắn'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['thread', 'created_at'], name='idx_msg_thread_created'),
            models.Index(fields=['sender', 'created_at'], name='idx_msg_sender_created'),
        ]

    def __str__(self):
        return f"Message #{self.id} by {self.sender_id} in Thread #{self.thread_id}"
