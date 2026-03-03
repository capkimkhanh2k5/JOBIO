from django.utils import timezone
from django.db import models

from apps.communication.messages.models import Message
from apps.communication.message_participants.models import MessageParticipant


class MessageService:
    """
    Service class for message operations using PostgreSQL.
    Replaces the former MongoChatService that used MongoDB.
    """

    @staticmethod
    def save_message(thread_id: int, sender_id: int, content: str,
                     attachments=None, is_system_message: bool = False) -> Message:
        """
        Lưu tin nhắn vào PostgreSQL.

        Args:
            thread_id: ID of the thread
            sender_id: ID of the sender
            content: Message content
            attachments: List of attachment URLs
            is_system_message: Whether this is a system message

        Returns:
            Created Message instance
        """
        message = Message.objects.create(
            thread_id=thread_id,
            sender_id=sender_id,
            content=content,
            attachments=attachments or [],
            is_system_message=is_system_message,
        )
        return message

    @staticmethod
    def get_messages(thread_id: int, limit: int = 50, offset: int = 0):
        """
        Lấy danh sách tin nhắn từ PostgreSQL (Pagination).

        Returns QuerySet of messages ordered by created_at ascending (oldest first).
        """
        return Message.objects.filter(
            thread_id=thread_id
        ).select_related('sender').order_by('created_at')[offset:offset + limit]

    @staticmethod
    def delete_message(message_id: int, user_id: int) -> bool:
        """
        Xóa tin nhắn (hard delete). Only the sender can delete.

        Returns:
            True if deleted successfully

        Raises:
            ValueError: If user is not the sender
        """
        try:
            message = Message.objects.get(id=message_id)
        except (Message.DoesNotExist, ValueError):
            return False

        if message.sender_id != user_id:
            raise ValueError("You can only delete your own messages")

        message.delete()
        return True

    @staticmethod
    def increment_unread_counters(thread_id: int, recipient_ids: list[int]):
        """
        Increment unread count for recipients in a thread.
        """
        if not recipient_ids:
            return

        MessageParticipant.objects.filter(
            thread_id=thread_id,
            user_id__in=recipient_ids,
            is_active=True,
        ).update(unread_count=models.F('unread_count') + 1)

    @staticmethod
    def mark_read(user_id: int, thread_id: int):
        """
        Reset unread count to 0 for a user in a thread.
        """
        MessageParticipant.objects.filter(
            thread_id=thread_id,
            user_id=user_id,
        ).update(unread_count=0, last_read_at=timezone.now())

    @staticmethod
    def get_total_unread_count(user_id: int) -> int:
        """
        Get total unread messages for a user across all threads.
        """
        result = MessageParticipant.objects.filter(
            user_id=user_id,
            is_active=True,
        ).aggregate(total=models.Sum('unread_count'))

        return result['total'] or 0

    @staticmethod
    def get_unread_count_for_thread(user_id: int, thread_id: int) -> int:
        """
        Get unread count for a specific user in a specific thread.
        """
        try:
            participant = MessageParticipant.objects.get(
                thread_id=thread_id,
                user_id=user_id,
                is_active=True,
            )
            return participant.unread_count
        except MessageParticipant.DoesNotExist:
            return 0
