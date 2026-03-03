from celery import shared_task
from apps.communication.messages.services.message_service import MessageService
from apps.communication.message_participants.models import MessageParticipant
import logging

logger = logging.getLogger(__name__)

@shared_task(name="apps.communication.messages.persist_chat_message")
def persist_chat_message_task(
    thread_id: int, 
    sender_id: int, 
    content: str,
):
    """
    Celery task to persist a chat message to PostgreSQL.
    
    Args:
        thread_id: ID of the thread
        sender_id: ID of the sender
        content: Message content
    """
    try:
        message = MessageService.save_message(
            thread_id=thread_id,
            sender_id=sender_id,
            content=content,
        )
        
        # Increment unread counters for other participants
        recipient_ids = list(MessageParticipant.objects.filter(
            thread_id=thread_id,
            is_active=True
        ).exclude(user_id=sender_id).values_list('user_id', flat=True))
        
        if recipient_ids:
            MessageService.increment_unread_counters(thread_id, recipient_ids)
        
        return f"Message {message.id} persisted for thread {thread_id}"
    except Exception as e:
        logger.error(f"Error persisting message: {str(e)}")
        raise e
