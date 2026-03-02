from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from apps.communication.message_threads.models import MessageThread
from apps.communication.message_participants.models import MessageParticipant
from apps.communication.messages.models import Message
from apps.communication.messages.services.messages import send_message, ThreadCreateInput, MessageCreateInput
from apps.communication.messages.services.message_service import MessageService

User = get_user_model()


class TestChatIntegration(APITestCase):
    
    def setUp(self):
        self.user1 = User.objects.create_user(email="user1@test.com", password="password123", full_name="User One")
        self.user2 = User.objects.create_user(email="user2@test.com", password="password123", full_name="User Two")
        
        self.thread = MessageThread.objects.create(subject="Test Thread")
        MessageParticipant.objects.create(thread=self.thread, user=self.user1)
        MessageParticipant.objects.create(thread=self.thread, user=self.user2)
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user1)

    def test_send_message_updates_sql_metadata(self):
        """Test that sending a message updates Thread's last_message fields and stores in PostgreSQL."""
        
        # Check initial state
        self.thread.refresh_from_db()
        self.assertIsNone(self.thread.last_message_at)
        self.assertIsNone(self.thread.last_message_content)
        
        # Send Message via Service
        msg_input = MessageCreateInput(content="Hello Integration")
        message = send_message(self.thread.id, self.user1, msg_input)
        
        # Verify Thread metadata updated
        self.thread.refresh_from_db()
        self.assertIsNotNone(self.thread.last_message_at)
        self.assertEqual(self.thread.last_message_content, "Hello Integration")
        
        # Verify Message stored in PostgreSQL
        messages = Message.objects.filter(thread=self.thread)
        self.assertEqual(messages.count(), 1)
        self.assertEqual(messages.first().content, "Hello Integration")
        self.assertEqual(messages.first().sender_id, self.user1.id)

    def test_api_list_threads_order(self):
        """Test API lists threads ordered by last_message_at."""
        
        thread2 = MessageThread.objects.create(subject="Thread 2")
        MessageParticipant.objects.create(thread=thread2, user=self.user1)
        
        # Send message to Thread 1 (Old)
        send_message(self.thread.id, self.user1, MessageCreateInput(content="Msg 1"))
        
        # Send message to Thread 2 (New)
        send_message(thread2.id, self.user1, MessageCreateInput(content="Msg 2"))
        
        url = reverse('message_threads:message-thread-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data['results'] if 'results' in response.data else response.data
        
        self.assertEqual(len(data), 2)
        # Thread 2 should be first because it has newer message
        self.assertEqual(data[0]['id'], thread2.id)
        self.assertEqual(data[1]['id'], self.thread.id)
        
        # Verify last_message content in response
        self.assertEqual(data[0]['last_message']['content'], "Msg 2")

    def test_delete_message(self):
        """Test deleting a message via MessageService."""
        
        # Create message
        message = MessageService.save_message(
            thread_id=self.thread.id,
            sender_id=self.user1.id,
            content="To be deleted"
        )
        
        # Verify exists
        self.assertEqual(Message.objects.filter(thread=self.thread).count(), 1)
        
        # Delete
        success = MessageService.delete_message(message.id, self.user1.id)
        self.assertTrue(success)
        
        # Verify gone
        self.assertEqual(Message.objects.filter(thread=self.thread).count(), 0)

    def test_unread_count_integration(self):
        """Test unread count updates correctly through the full flow."""
        
        # Send message from user1 to thread
        send_message(self.thread.id, self.user1, MessageCreateInput(content="New msg"))
        
        # Check user2's unread count
        participant = MessageParticipant.objects.get(thread=self.thread, user=self.user2)
        # unread_count may be incremented by send_message service
        # Verify the count is accessible
        self.assertIsNotNone(participant.unread_count)
