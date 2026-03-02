# MessageThread ViewSet Tests (PostgreSQL)

from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.communication.message_threads.models import MessageThread
from apps.communication.message_participants.models import MessageParticipant
from apps.communication.messages.models import Message

User = get_user_model()


class MessageViewTests(APITestCase):
    
    @classmethod
    def setUpTestData(cls):
        # Create users
        cls.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            full_name='Test User'
        )
        cls.other_user = User.objects.create_user(
            email='otheruser@example.com',
            password='testpass123',
            full_name='Other User'
        )
        cls.third_user = User.objects.create_user(
            email='thirduser@example.com',
            password='testpass123',
            full_name='Third User'
        )
        
        # Create user's thread
        cls.message_thread = MessageThread.objects.create(subject='Test Thread')
        MessageParticipant.objects.create(thread=cls.message_thread, user=cls.user)
        MessageParticipant.objects.create(thread=cls.message_thread, user=cls.other_user)
        
        # Create other users' thread
        cls.other_thread = MessageThread.objects.create(subject='Other Thread')
        MessageParticipant.objects.create(thread=cls.other_thread, user=cls.other_user)
        MessageParticipant.objects.create(thread=cls.other_thread, user=cls.third_user)

    def setUp(self):
        self.client.force_authenticate(user=self.user)

    def test_list_threads_success(self):
        """Test listing threads returns user's threads."""
        url = '/api/messages/threads/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_threads_unauthenticated(self):
        """Test listing threads requires authentication."""
        self.client.logout()
        url = '/api/messages/threads/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_threads_only_participating(self):
        """Test user only sees threads they participate in."""
        url = '/api/messages/threads/'
        response = self.client.get(url)
        
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        thread_ids = [t['id'] for t in data]
        self.assertIn(self.message_thread.id, thread_ids)
        self.assertNotIn(self.other_thread.id, thread_ids)

    def test_create_thread_success(self):
        """Test creating a new thread."""
        url = '/api/messages/threads/'
        data = {
            'participant_ids': [self.other_user.id],
            'subject': 'New Conversation',
            'initial_message': 'Hello!'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['subject'], 'New Conversation')
        self.assertEqual(len(response.data['participants']), 2)

    def test_create_thread_without_subject(self):
        """Test creating thread without subject."""
        url = '/api/messages/threads/'
        data = {
            'participant_ids': [self.other_user.id]
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_thread_invalid_participant(self):
        """Test creating thread with invalid participant."""
        url = '/api/messages/threads/'
        data = {
            'participant_ids': [99999],
            'subject': 'Invalid'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_thread_empty_participants(self):
        """Test creating thread with empty participants."""
        url = '/api/messages/threads/'
        data = {
            'participant_ids': [],
            'subject': 'Empty'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_thread_success(self):
        """Test retrieving thread detail."""
        url = f'/api/messages/threads/{self.message_thread.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.message_thread.id)
        self.assertIn('participants', response.data)

    def test_retrieve_thread_not_participant(self):
        """Test cannot retrieve thread not participating in."""
        url = f'/api/messages/threads/{self.other_thread.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_thread_not_found(self):
        """Test retrieving non-existent thread."""
        url = '/api/messages/threads/99999/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_leave_thread_success(self):
        """Test leaving a thread."""
        thread = MessageThread.objects.create(subject='Temp Thread')
        MessageParticipant.objects.create(thread=thread, user=self.user)
        
        url = f'/api/messages/threads/{thread.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_leave_thread_not_participant(self):
        """Test cannot leave thread not participating in."""
        url = f'/api/messages/threads/{self.other_thread.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_messages_success(self):
        """Test listing messages in thread."""
        # Create messages in PostgreSQL
        Message.objects.create(
            thread=self.message_thread,
            sender=self.user,
            content='Hi there'
        )
        
        url = f'/api/messages/threads/{self.message_thread.id}/messages/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_send_message_success(self):
        """Test sending a message to thread."""
        url = f'/api/messages/threads/{self.message_thread.id}/messages/'
        data = {'content': 'Hello, this is a new message!'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Hello, this is a new message!')
        self.assertIn('sender', response.data)

    def test_send_message_empty_content(self):
        """Test sending message with empty content."""
        url = f'/api/messages/threads/{self.message_thread.id}/messages/'
        data = {'content': ''}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_send_message_not_participant(self):
        """Test cannot send message to thread not participating in."""
        url = f'/api/messages/threads/{self.other_thread.id}/messages/'
        data = {'content': 'Unauthorized message'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mark_read_success(self):
        """Test marking thread as read."""
        url = f'/api/messages/threads/{self.message_thread.id}/read/'
        response = self.client.patch(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mark_read_not_participant(self):
        """Test cannot mark thread not participating in."""
        url = f'/api/messages/threads/{self.other_thread.id}/read/'
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_add_participant_success(self):
        """Test adding a new participant."""
        url = f'/api/messages/threads/{self.message_thread.id}/participants/'
        data = {'user_id': self.third_user.id}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MessageParticipant.objects.filter(
            thread=self.message_thread, user=self.third_user, is_active=True
        ).exists())

    def test_add_participant_already_exists(self):
        """Test adding participant already in thread."""
        url = f'/api/messages/threads/{self.message_thread.id}/participants/'
        data = {'user_id': self.other_user.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_add_participant_invalid_user(self):
        """Test adding non-existent user."""
        url = f'/api/messages/threads/{self.message_thread.id}/participants/'
        data = {'user_id': 99999}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_participant_success(self):
        """Test removing a participant."""
        MessageParticipant.objects.create(thread=self.message_thread, user=self.third_user)
        url = f'/api/messages/threads/{self.message_thread.id}/participants/{self.third_user.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_remove_self_from_thread(self):
        """Test user can remove themselves."""
        thread = MessageThread.objects.create(subject='Temp')
        MessageParticipant.objects.create(thread=thread, user=self.user)
        MessageParticipant.objects.create(thread=thread, user=self.other_user)
        url = f'/api/messages/threads/{thread.id}/participants/{self.user.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
