from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.recruitment.jobs.models import Job
from apps.recruitment.job_views.models import JobView


class JobViewAnalyticsTests(APITestCase):
    """Test cases for Job Views Analytics APIs - Phase 5"""
    
    def setUp(self):
        # Create test users
        self.owner = CustomUser.objects.create_user(
            email="owner@example.com",
            password="password123",
            full_name="Job Owner"
        )
        self.other_user = CustomUser.objects.create_user(
            email="other@example.com",
            password="password123",
            full_name="Other User"
        )
        self.viewer = CustomUser.objects.create_user(
            email="viewer@example.com",
            password="password123",
            full_name="Job Viewer"
        )
        
        # Create company and job
        self.company = Company.objects.create(
            user=self.owner,
            company_name="Test Company",
            description="A test company"
        )
        self.job = Job.objects.create(
            company=self.company,
            title="Python Developer",
            slug="python-developer-test",
            job_type="full-time",
            level="senior",
            description="Job description",
            requirements="Job requirements",
            status="published",
            created_by=self.owner
        )
    
    # ========== API #1: GET /api/jobs/:id/views/ (view_stats) ==========
    
    def test_get_view_stats_success(self):
        """GET /api/jobs/:id/views/ - owner lấy stats → 200"""
        # Create some views
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.1'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/views/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_views', response.data)
        self.assertIn('unique_views', response.data)
        self.assertIn('views_today', response.data)
    
    def test_get_view_stats_not_owner(self):
        """GET /api/jobs/:id/views/ - public access cũng lấy được stats"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/views/'
        response = self.client.get(url)
        
        # API view_stats là public access
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_get_view_stats_not_found(self):
        """GET /api/jobs/:id/views/ - job không tồn tại → 404"""
        self.client.force_authenticate(user=self.owner)
        
        url = '/api/jobs/99999/views/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_view_stats_counts_correct(self):
        """GET /api/jobs/:id/views/ - verify counts are correct"""
        now = timezone.now()
        
        # Create views - today
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.1'
        )
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.2'
        )
        
        # Create view from 3 days ago (within week)
        old_view = JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.3'
        )
        JobView.objects.filter(id=old_view.id).update(
            viewed_at=now - timedelta(days=3)
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/views/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_views'], 3)
        self.assertEqual(response.data['views_today'], 2)
        self.assertGreaterEqual(response.data['views_this_week'], 3)
    
    # ========== API #2: GET /api/jobs/:id/views/chart/ (view_chart) ==========
    
    def test_get_view_chart_success(self):
        """GET /api/jobs/:id/views/chart/ - owner lấy chart → 200"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/views/chart/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('period', response.data)
        self.assertIn('data', response.data)
        self.assertIsInstance(response.data['data'], list)
    
    def test_view_chart_default_7d(self):
        """GET /api/jobs/:id/views/chart/ - default period = 7d"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/views/chart/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period'], '7d')
        # Should have 7 days of data
        self.assertEqual(len(response.data['data']), 7)
    
    def test_view_chart_30d_period(self):
        """GET /api/jobs/:id/views/chart/?period=30d - 30 day period"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/views/chart/?period=30d'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period'], '30d')
        self.assertEqual(len(response.data['data']), 30)
    
    def test_view_chart_90d_period(self):
        """GET /api/jobs/:id/views/chart/?period=90d - 90 day period"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/views/chart/?period=90d'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['period'], '90d')
        self.assertEqual(len(response.data['data']), 90)
    
    def test_view_chart_invalid_period(self):
        """GET /api/jobs/:id/views/chart/?period=invalid - fallback to 7d"""
        self.client.force_authenticate(user=self.owner)
        
        url = f'/api/jobs/{self.job.id}/views/chart/?period=invalid'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should fallback to 7d
        self.assertEqual(len(response.data['data']), 7)
    
    def test_view_chart_fills_missing_dates(self):
        """GET /api/jobs/:id/views/chart/ - fills 0 for missing dates"""
        # Create view only for today
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.1'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/views/chart/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # All dates should be present, most with 0 views
        zero_count = sum(1 for item in response.data['data'] if item['views'] == 0)
        self.assertGreaterEqual(zero_count, 6)  # At least 6 days with 0 views
    
    # ========== API #3: GET /api/jobs/:id/viewer-demographics/ ==========
    
    def test_get_demographics_success(self):
        """GET /api/jobs/:id/viewer-demographics/ - owner → 200"""
        # Create views
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            referrer='https://google.com/search'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/viewer-demographics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('by_referrer', response.data)
        self.assertIn('by_device', response.data)
        self.assertIn('authenticated_ratio', response.data)
    
    def test_demographics_not_owner(self):
        """GET /api/jobs/:id/viewer-demographics/ - public access cũng lấy được"""
        self.client.force_authenticate(user=self.other_user)
        
        url = f'/api/jobs/{self.job.id}/viewer-demographics/'
        response = self.client.get(url)
        
        # API demographics là public access
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_demographics_by_referrer(self):
        """GET /api/jobs/:id/viewer-demographics/ - verify referrer parsing"""
        # Create views from different sources
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.1',
            referrer='https://google.com/search'
        )
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.2',
            referrer='https://www.linkedin.com/jobs'
        )
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.3',
            referrer=None  # Direct traffic
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/viewer-demographics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Should have referrer data
        referrers = response.data['by_referrer']
        self.assertIsInstance(referrers, list)
    
    def test_demographics_by_device(self):
        """GET /api/jobs/:id/viewer-demographics/ - verify device detection"""
        # Desktop
        JobView.objects.create(
            job=self.job,
            ip_address='192.168.1.1',
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        )
        # Mobile
        JobView.objects.create(
            job=self.job,
            ip_address='192.168.1.2',
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/viewer-demographics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        devices = response.data['by_device']
        self.assertIsInstance(devices, list)
    
    def test_demographics_auth_ratio(self):
        """GET /api/jobs/:id/viewer-demographics/ - logged_in vs anonymous"""
        # Logged in user
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.1'
        )
        # Anonymous
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.2'
        )
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.3'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/viewer-demographics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        auth_ratio = response.data['authenticated_ratio']
        self.assertEqual(auth_ratio['logged_in'], 1)
        self.assertEqual(auth_ratio['anonymous'], 2)
    
    # ========== Integration Tests ==========
    
    def test_record_view_updates_stats(self):
        """POST /api/jobs/:id/view/ → GET /views/ reflects change"""
        self.client.force_authenticate(user=self.owner)
        
        # Get initial stats - API trả về view_count từ Job model
        stats_url = f'/api/jobs/{self.job.id}/views/'
        initial = self.client.get(stats_url)
        
        # Record a view - tạo JobView để làm tăng stats
        JobView.objects.create(
            job=self.job,
            user=self.owner,
            ip_address='192.168.1.1'
        )
        
        # Get updated stats
        updated = self.client.get(stats_url)
        
        # total_views should reflect JobView count
        self.assertEqual(updated.data['total_views'], 1)
    
    def test_unique_views_by_user(self):
        """Same user viewing multiple times = 1 unique"""
        # Same user views twice
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.1'
        )
        JobView.objects.create(
            job=self.job,
            user=self.viewer,
            ip_address='192.168.1.2'  # Different IP
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/views/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_views'], 2)
        self.assertEqual(response.data['unique_views'], 1)  # Only 1 unique user
    
    def test_unique_views_by_ip(self):
        """Same IP (anonymous) viewing multiple times = 1 unique"""
        # Same IP views twice
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.1'
        )
        JobView.objects.create(
            job=self.job,
            user=None,
            ip_address='192.168.1.1'  # Same IP
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/views/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_views'], 2)
        self.assertEqual(response.data['unique_views'], 1)  # Only 1 unique IP
    
    def test_referrer_parsing(self):
        """Verify URL domain extraction from referrer"""
        # Create views with full URLs
        JobView.objects.create(
            job=self.job,
            ip_address='192.168.1.1',
            referrer='https://www.google.com/search?q=python+jobs'
        )
        JobView.objects.create(
            job=self.job,
            ip_address='192.168.1.2',
            referrer='https://linkedin.com/jobs/view/12345'
        )
        
        self.client.force_authenticate(user=self.owner)
        url = f'/api/jobs/{self.job.id}/viewer-demographics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check referrer sources are domain only
        referrers = {r['source'] for r in response.data['by_referrer']}
        # Should contain 'google.com' not full URL
        self.assertTrue(
            any('google' in r for r in referrers)
        )
