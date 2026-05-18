import os
import django
from django.conf import settings
from django.test.utils import get_runner

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from apps.core.users.tests.test_user_management import TestUserManagement
from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io
from apps.core.users.models import CustomUser

class DummyTest:
    def run(self):
        client = APIClient()
        CustomUser.objects.all().delete()
        user = CustomUser.objects.create_user(email="test@example.com", password="password")
        client.force_authenticate(user=user)
        
        file = io.BytesIO()
        image = Image.new("RGB", (100, 100), "white")
        image.save(file, "jpeg")
        file.seek(0)
        avatar = SimpleUploadedFile("avatar.jpg", file.read(), content_type="image/jpeg")
        
        response = client.post(f"/api/users/{user.id}/avatar/", {"avatar": avatar}, format="multipart")
        print("Status code:", response.status_code)
        print("Response data:", response.data)

DummyTest().run()
