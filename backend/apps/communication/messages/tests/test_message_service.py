"""
Tests for MessageService (PostgreSQL-based replacement for MongoChatService).
"""
from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.communication.message_threads.models import MessageThread
from apps.communication.message_participants.models import MessageParticipant
from apps.communication.messages.models import Message
from apps.communication.messages.services.message_service import MessageService

User = get_user_model()


class TestMessageServiceSaveMessage(TestCase):
    """Test cases for MessageService.save_message()."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='sender@test.com', password='pw', full_name='Sender'
        )
        cls.thread = MessageThread.objects.create(subject='Test')
        MessageParticipant.objects.create(thread=cls.thread, user=cls.user)

    def test_save_message_creates_record(self):
        msg = MessageService.save_message(
            thread_id=self.thread.id,
            sender_id=self.user.id,
            content='Hello World',
        )
        self.assertIsInstance(msg, Message)
        self.assertEqual(msg.content, 'Hello World')
        self.assertEqual(msg.sender_id, self.user.id)
        self.assertEqual(msg.thread_id, self.thread.id)
        self.assertFalse(msg.is_system_message)

    def test_save_system_message(self):
        msg = MessageService.save_message(
            thread_id=self.thread.id,
            sender_id=self.user.id,
            content='User joined',
            is_system_message=True,
        )
        self.assertTrue(msg.is_system_message)

    def test_save_message_with_attachments(self):
        msg = MessageService.save_message(
            thread_id=self.thread.id,
            sender_id=self.user.id,
            content='See file',
            attachments=['https://example.com/file.pdf'],
        )
        self.assertEqual(msg.attachments, ['https://example.com/file.pdf'])

    def test_save_message_attachments_none(self):
        msg = MessageService.save_message(
            thread_id=self.thread.id,
            sender_id=self.user.id,
            content='No attachment',
        )
        self.assertEqual(msg.attachments, [])


class TestMessageServiceGetMessages(TestCase):
    """Test cases for MessageService.get_messages()."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='reader@test.com', password='pw', full_name='Reader'
        )
        cls.thread = MessageThread.objects.create(subject='Chat')
        MessageParticipant.objects.create(thread=cls.thread, user=cls.user)

        # Create messages in order
        for i in range(5):
            Message.objects.create(
                thread=cls.thread, sender=cls.user, content=f'Message {i}'
            )

    def test_get_messages_returns_queryset(self):
        qs = MessageService.get_messages(thread_id=self.thread.id)
        self.assertEqual(qs.count(), 5)

    def test_get_messages_ordered_ascending(self):
        qs = MessageService.get_messages(thread_id=self.thread.id)
        contents = list(qs.values_list('content', flat=True))
        self.assertEqual(contents, [f'Message {i}' for i in range(5)])

    def test_get_messages_empty_thread(self):
        empty_thread = MessageThread.objects.create(subject='Empty')
        qs = MessageService.get_messages(thread_id=empty_thread.id)
        self.assertEqual(qs.count(), 0)


class TestMessageServiceDeleteMessage(TestCase):
    """Test cases for MessageService.delete_message()."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email='deleter@test.com', password='pw', full_name='Deleter'
        )
        cls.other = User.objects.create_user(
            email='other@test.com', password='pw', full_name='Other'
        )
        cls.thread = MessageThread.objects.create(subject='Del Thread')

    def test_delete_own_message(self):
        msg = Message.objects.create(
            thread=self.thread, sender=self.user, content='To delete'
        )
        result = MessageService.delete_message(msg.id, self.user.id)
        self.assertTrue(result)
        self.assertFalse(Message.objects.filter(id=msg.id).exists())

    def test_delete_others_message_fails(self):
        msg = Message.objects.create(
            thread=self.thread, sender=self.user, content='Not yours'
        )
        with self.assertRaises(ValueError):
            MessageService.delete_message(msg.id, self.other.id)
        # Message should still exist
        self.assertTrue(Message.objects.filter(id=msg.id).exists())

    def test_delete_nonexistent_message(self):
        result = MessageService.delete_message(99999, self.user.id)
        self.assertFalse(result)


class TestUnreadCounters(TestCase):
    """Test cases for unread counter operations."""

    @classmethod
    def setUpTestData(cls):
        cls.user1 = User.objects.create_user(
            email='u1@test.com', password='pw', full_name='User1'
        )
        cls.user2 = User.objects.create_user(
            email='u2@test.com', password='pw', full_name='User2'
        )
        cls.user3 = User.objects.create_user(
            email='u3@test.com', password='pw', full_name='User3'
        )
        cls.thread = MessageThread.objects.create(subject='Unread Thread')
        MessageParticipant.objects.create(thread=cls.thread, user=cls.user1)
        MessageParticipant.objects.create(thread=cls.thread, user=cls.user2)
        MessageParticipant.objects.create(thread=cls.thread, user=cls.user3)

    def test_increment_unread_counters(self):
        MessageService.increment_unread_counters(
            self.thread.id, [self.user2.id, self.user3.id]
        )
        p2 = MessageParticipant.objects.get(thread=self.thread, user=self.user2)
        p3 = MessageParticipant.objects.get(thread=self.thread, user=self.user3)
        self.assertEqual(p2.unread_count, 1)
        self.assertEqual(p3.unread_count, 1)

        # Increment again
        MessageService.increment_unread_counters(
            self.thread.id, [self.user2.id]
        )
        p2.refresh_from_db()
        self.assertEqual(p2.unread_count, 2)

    def test_increment_empty_list(self):
        # Should not raise
        MessageService.increment_unread_counters(self.thread.id, [])

    def test_mark_read_resets_count(self):
        MessageService.increment_unread_counters(
            self.thread.id, [self.user2.id]
        )
        MessageService.mark_read(self.user2.id, self.thread.id)
        p2 = MessageParticipant.objects.get(thread=self.thread, user=self.user2)
        self.assertEqual(p2.unread_count, 0)

    def test_get_total_unread_count(self):
        # Create a second thread
        thread2 = MessageThread.objects.create(subject='Thread 2')
        MessageParticipant.objects.create(thread=thread2, user=self.user1)

        MessageService.increment_unread_counters(self.thread.id, [self.user1.id])
        MessageService.increment_unread_counters(thread2.id, [self.user1.id])
        MessageService.increment_unread_counters(thread2.id, [self.user1.id])

        total = MessageService.get_total_unread_count(self.user1.id)
        self.assertEqual(total, 3)

    def test_get_total_unread_count_no_data(self):
        total = MessageService.get_total_unread_count(99999)
        self.assertEqual(total, 0)

    def test_get_unread_count_for_thread(self):
        MessageService.increment_unread_counters(
            self.thread.id, [self.user1.id]
        )
        count = MessageService.get_unread_count_for_thread(
            self.user1.id, self.thread.id
        )
        self.assertEqual(count, 1)
