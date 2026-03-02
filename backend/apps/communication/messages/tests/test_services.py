# Messages Services Tests (PostgreSQL)

from django.test import TestCase
from django.contrib.auth import get_user_model

from apps.communication.message_threads.models import MessageThread
from apps.communication.message_participants.models import MessageParticipant
from apps.communication.messages.models import Message
from apps.communication.messages.services.messages import (
    create_thread,
    delete_thread,
    send_message,
    delete_message,
    mark_thread_as_read,
    add_participant,
    remove_participant,
    ThreadCreateInput,
    MessageCreateInput,
)

User = get_user_model()


class MessageServiceTests(TestCase):
    
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
        
        # Create a thread
        cls.message_thread = MessageThread.objects.create(subject='Test Thread')
        MessageParticipant.objects.create(thread=cls.message_thread, user=cls.user)
        MessageParticipant.objects.create(thread=cls.message_thread, user=cls.other_user)

    def test_create_thread_success(self):
        """Test creating a thread with participants and initial message."""
        data = ThreadCreateInput(
            participant_ids=[self.other_user.id],
            subject='New Thread',
            initial_message='Hello!'
        )
        
        thread = create_thread(self.user, data)
        
        self.assertIsNotNone(thread.id)
        self.assertEqual(thread.subject, 'New Thread')
        
        # Check participants
        participants = thread.participants.all()
        self.assertEqual(participants.count(), 2)
        
        participant_user_ids = [p.user_id for p in participants]
        self.assertIn(self.user.id, participant_user_ids)
        self.assertIn(self.other_user.id, participant_user_ids)
        
        # Initial message should be saved in PostgreSQL
        self.assertTrue(Message.objects.filter(thread=thread, content='Hello!').exists())

    def test_create_thread_without_initial_message(self):
        """Test creating thread without initial message."""
        data = ThreadCreateInput(
            participant_ids=[self.other_user.id],
            subject='Empty Thread'
        )
        
        thread = create_thread(self.user, data)
        
        self.assertIsNotNone(thread.id)
        self.assertEqual(Message.objects.filter(thread=thread).count(), 0)

    def test_create_thread_creator_added(self):
        """Test creator is automatically added to participants."""
        data = ThreadCreateInput(
            participant_ids=[self.other_user.id]
        )
        
        thread = create_thread(self.user, data)
        
        self.assertTrue(MessageParticipant.objects.filter(
            thread=thread, user=self.user
        ).exists())

    def test_create_thread_invalid_participant(self):
        """Test creating thread with invalid participant."""
        data = ThreadCreateInput(
            participant_ids=[99999]
        )
        
        with self.assertRaisesRegex(ValueError, "do not exist"):
            create_thread(self.user, data)

    def test_delete_thread_success(self):
        """Test soft deleting/leaving a thread."""
        thread = MessageThread.objects.create(subject='To Delete')
        MessageParticipant.objects.create(thread=thread, user=self.user)
        MessageParticipant.objects.create(thread=thread, user=self.other_user)

        result = delete_thread(thread.id, self.user.id)
        
        self.assertTrue(result)
        
        # Check user is inactive in thread
        participant = MessageParticipant.objects.get(thread=thread, user=self.user)
        self.assertFalse(participant.is_active)
        
        # Thread and other participant still exist
        self.assertTrue(MessageThread.objects.filter(id=thread.id).exists())
        other_participant = MessageParticipant.objects.get(thread=thread, user=self.other_user)
        self.assertTrue(other_participant.is_active)

    def test_delete_thread_not_participant(self):
        """Test cannot delete thread not participating in."""
        with self.assertRaisesRegex(ValueError, "not a participant"):
            delete_thread(self.message_thread.id, self.third_user.id)

    def test_send_message_success(self):
        """Test sending a message returns a Message instance."""
        data = MessageCreateInput(content='Hello World!')
        message = send_message(self.message_thread.id, self.user, data)
        
        self.assertIsInstance(message, Message)
        self.assertEqual(message.content, 'Hello World!')
        self.assertEqual(message.sender_id, self.user.id)
        self.assertEqual(message.thread_id, self.message_thread.id)

    def test_send_message_with_attachment(self):
        """Test sending message with attachment URL."""
        data = MessageCreateInput(
            content='Check this out',
            attachment_url='https://example.com/file.pdf'
        )
        
        message = send_message(self.message_thread.id, self.user, data)
        
        self.assertIn('https://example.com/file.pdf', message.attachments)

    def test_send_message_not_participant(self):
        """Test cannot send message if not participant."""
        data = MessageCreateInput(content='Unauthorized')
        
        with self.assertRaisesRegex(ValueError, "not a participant"):
            send_message(self.message_thread.id, self.third_user, data)

    def test_send_message_updates_thread(self):
        """Test sending message updates thread's updated_at."""
        original_updated = self.message_thread.updated_at
        
        data = MessageCreateInput(content='New message')
        send_message(self.message_thread.id, self.user, data)
        
        self.message_thread.refresh_from_db()
        self.assertGreaterEqual(self.message_thread.updated_at, original_updated)
        self.assertEqual(self.message_thread.last_message_content, 'New message')

    def test_send_message_increments_unread(self):
        """Test sending message increments unread counters for other participants."""
        data = MessageCreateInput(content='Unread test')
        send_message(self.message_thread.id, self.user, data)
        
        # Other user should have unread_count=1
        p = MessageParticipant.objects.get(thread=self.message_thread, user=self.other_user)
        self.assertEqual(p.unread_count, 1)
        
        # Sender's unread should be 0
        p_sender = MessageParticipant.objects.get(thread=self.message_thread, user=self.user)
        self.assertEqual(p_sender.unread_count, 0)

    def test_delete_message_success(self):
        """Test deleting own message."""
        msg = Message.objects.create(
            thread=self.message_thread, sender=self.user, content='To delete'
        )
        result = delete_message(msg.id, self.user.id)
        self.assertTrue(result)
        self.assertFalse(Message.objects.filter(id=msg.id).exists())

    def test_delete_message_not_found(self):
        """Test deleting non-existent message."""
        result = delete_message(99999, self.user.id)
        self.assertFalse(result)

    def test_mark_thread_as_read_success(self):
        """Test marking thread as read."""
        # First send a message to create unread
        send_message(
            self.message_thread.id, self.user,
            MessageCreateInput(content='Mark read test')
        )
        
        result = mark_thread_as_read(self.message_thread.id, self.other_user.id)
        
        self.assertTrue(result)
        participant = MessageParticipant.objects.get(
            thread=self.message_thread, user=self.other_user
        )
        self.assertIsNotNone(participant.last_read_at)
        self.assertEqual(participant.unread_count, 0)

    def test_mark_thread_as_read_not_participant(self):
        """Test cannot mark thread not participating in."""
        with self.assertRaisesRegex(ValueError, "not a participant"):
            mark_thread_as_read(self.message_thread.id, self.third_user.id)

    def test_add_participant_success(self):
        """Test adding a new participant."""
        participant = add_participant(
            thread_id=self.message_thread.id,
            user_id=self.third_user.id,
            adder_id=self.user.id
        )
        
        self.assertIsNotNone(participant)
        self.assertEqual(participant.user, self.third_user)
        self.assertTrue(participant.is_active)
        
        # System message should be created
        self.assertTrue(Message.objects.filter(
            thread=self.message_thread,
            is_system_message=True,
            content__contains='added'
        ).exists())

    def test_add_participant_already_exists(self):
        """Test adding participant already in thread."""
        with self.assertRaisesRegex(ValueError, "already a participant"):
            add_participant(self.message_thread.id, self.other_user.id, self.user.id)

    def test_add_participant_reactivate(self):
        """Test re-adding inactive participant."""
        participant = MessageParticipant.objects.get(
            thread=self.message_thread, user=self.other_user
        )
        participant.is_active = False
        participant.save()
        
        reactivated = add_participant(
            self.message_thread.id, self.other_user.id, self.user.id
        )
        
        self.assertTrue(reactivated.is_active)

    def test_add_participant_not_participant(self):
        """Test non-participant cannot add others."""
        new_user = User.objects.create_user(email='new@test.com', password='pw', full_name='New')
        
        with self.assertRaisesRegex(ValueError, "not a participant"):
            add_participant(self.message_thread.id, new_user.id, self.third_user.id)

    def test_add_participant_invalid_user(self):
        """Test adding non-existent user."""
        with self.assertRaisesRegex(ValueError, "does not exist"):
            add_participant(self.message_thread.id, 99999, self.user.id)

    def test_remove_participant_success(self):
        """Test removing a participant."""
        result = remove_participant(
            thread_id=self.message_thread.id,
            user_id=self.other_user.id,
            remover_id=self.user.id
        )
        
        self.assertTrue(result)
        
        participant = MessageParticipant.objects.get(
            thread=self.message_thread, user=self.other_user
        )
        self.assertFalse(participant.is_active)
        
        # System message should be created
        self.assertTrue(Message.objects.filter(
            thread=self.message_thread,
            is_system_message=True,
            content__contains='removed'
        ).exists())

    def test_remove_self(self):
        """Test user can remove themselves."""
        # Create fresh thread to avoid side effects
        thread = MessageThread.objects.create(subject='Self Remove')
        MessageParticipant.objects.create(thread=thread, user=self.user)
        MessageParticipant.objects.create(thread=thread, user=self.other_user)
        
        result = remove_participant(thread.id, self.user.id, self.user.id)
        
        self.assertTrue(result)
        # System message should say "left"
        self.assertTrue(Message.objects.filter(
            thread=thread,
            is_system_message=True,
            content__contains='left'
        ).exists())

    def test_remove_participant_not_participant(self):
        """Test non-participant cannot remove others."""
        with self.assertRaisesRegex(ValueError, "not a participant"):
            remove_participant(self.message_thread.id, self.other_user.id, self.third_user.id)

    def test_remove_nonexistent_participant(self):
        """Test removing someone not in thread."""
        with self.assertRaisesRegex(ValueError, "not a participant"):
            remove_participant(self.message_thread.id, self.third_user.id, self.user.id)

