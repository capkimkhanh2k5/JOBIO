import pytest
from rest_framework import status
from apps.core.users.models import CustomUser
from apps.company.companies.models import Company
from apps.company.company_benefits.models import CompanyBenefit
from apps.company.benefit_categories.models import BenefitCategory


# ============================================================================
# URL PATHS (Nested under companies)
# ============================================================================
def benefits_list(company_id): 
    return f'/api/companies/{company_id}/benefits/'

def benefit_detail(company_id, benefit_id): 
    return f'/api/companies/{company_id}/benefits/{benefit_id}/'

def benefits_reorder(company_id): 
    return f'/api/companies/{company_id}/benefits/reorder/'


@pytest.fixture
def category(db):
    """Tạo BenefitCategory"""
    return BenefitCategory.objects.create(
        name="Bảo hiểm",
        slug="bao-hiem",
        icon_url="https://example.com/icon.png",
        is_active=True,
        display_order=1
    )


@pytest.fixture
def company_owner(db):
    """Tạo user sở hữu company"""
    return CustomUser.objects.create_user(
        email="owner@example.com",
        password="password123",
        full_name="Company Owner",
        role="company"
    )


@pytest.fixture
def company(db, company_owner):
    """Tạo company"""
    return Company.objects.create(
        user=company_owner,
        company_name="Test Company",
        slug="test-company"
    )


@pytest.fixture
def other_user(db):
    """Tạo user khác"""
    return CustomUser.objects.create_user(
        email="other@example.com",
        password="password123",
        full_name="Other User"
    )


@pytest.fixture
def benefit(db, company, category):
    """Tạo benefit"""
    return CompanyBenefit.objects.create(
        company=company,
        category=category,
        benefit_name="Bảo hiểm sức khỏe",
        description="Bảo hiểm toàn diện",
        display_order=1
    )


@pytest.mark.django_db
class TestCompanyBenefitsAPIs:
    
    # --- LIST BENEFITS ---
    
    def test_list_benefits_success(self, api_client, company, benefit):
        """GET /api/companies/:id/benefits/ - Thành công"""
        response = api_client.get(benefits_list(company.id))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['benefit_name'] == 'Bảo hiểm sức khỏe'
    
    def test_list_benefits_invalid_company(self, api_client):
        """GET /api/companies/9999/benefits/ - Company không tồn tại"""
        response = api_client.get(benefits_list(9999))
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # --- CREATE BENEFIT ---
    
    def test_create_benefit_success(self, api_client, company_owner, company, category):
        """POST /api/companies/:id/benefits/ - Thành công"""
        api_client.force_authenticate(user=company_owner)
        data = {
            'category_id': category.id,
            'benefit_name': 'Thưởng Tết',
            'description': 'Thưởng 13 tháng lương'
        }
        response = api_client.post(benefits_list(company.id), data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['benefit_name'] == 'Thưởng Tết'
        assert CompanyBenefit.objects.count() == 1
    
    def test_create_benefit_not_owner(self, api_client, other_user, company, category):
        """POST /api/companies/:id/benefits/ - Không phải owner -> 403"""
        api_client.force_authenticate(user=other_user)
        data = {
            'category_id': category.id,
            'benefit_name': 'Test'
        }
        # Thử tạo cho company không thuộc sở hữu
        response = api_client.post(benefits_list(company.id), data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_create_benefit_unauthenticated(self, api_client, company, category):
        """POST /api/companies/:id/benefits/ - Chưa login -> 401"""
        data = {
            'category_id': category.id,
            'benefit_name': 'Test'
        }
        response = api_client.post(benefits_list(company.id), data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_benefit_invalid_category(self, api_client, company_owner, company):
        """POST /api/companies/:id/benefits/ - Category không hợp lệ"""
        api_client.force_authenticate(user=company_owner)
        data = {
            'category_id': 9999,
            'benefit_name': 'Test'
        }
        response = api_client.post(benefits_list(company.id), data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
    
    # --- RETRIEVE BENEFIT ---
    
    def test_retrieve_benefit_success(self, api_client, company, benefit):
        """GET /api/companies/:id/benefits/:pk/ - Thành công"""
        response = api_client.get(benefit_detail(company.id, benefit.id))
        assert response.status_code == status.HTTP_200_OK
        assert response.data['benefit_name'] == 'Bảo hiểm sức khỏe'
    
    def test_retrieve_benefit_not_found(self, api_client, company):
        """GET /api/companies/:id/benefits/9999/ - Không tồn tại"""
        response = api_client.get(benefit_detail(company.id, 9999))
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    # --- UPDATE BENEFIT ---
    
    def test_update_benefit_success(self, api_client, company_owner, company, benefit):
        """PUT /api/companies/:id/benefits/:pk/ - Thành công"""
        api_client.force_authenticate(user=company_owner)
        data = {
            'benefit_name': 'Updated Benefit',
            'description': 'Updated description'
        }
        response = api_client.put(benefit_detail(company.id, benefit.id), data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['benefit_name'] == 'Updated Benefit'
        
        benefit.refresh_from_db()
        assert benefit.benefit_name == 'Updated Benefit'
    
    def test_update_benefit_not_owner(self, api_client, other_user, company, benefit):
        """PUT /api/companies/:id/benefits/:pk/ - Không phải owner -> 403"""
        api_client.force_authenticate(user=other_user)
        data = {'benefit_name': 'Hacked'}
        response = api_client.put(benefit_detail(company.id, benefit.id), data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    # --- DELETE BENEFIT ---
    
    def test_delete_benefit_success(self, api_client, company_owner, company, benefit):
        """DELETE /api/companies/:id/benefits/:pk/ - Thành công"""
        api_client.force_authenticate(user=company_owner)
        response = api_client.delete(benefit_detail(company.id, benefit.id))
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert CompanyBenefit.objects.count() == 0
    
    def test_delete_benefit_not_owner(self, api_client, other_user, company, benefit):
        """DELETE /api/companies/:id/benefits/:pk/ - Không phải owner -> 403"""
        api_client.force_authenticate(user=other_user)
        response = api_client.delete(benefit_detail(company.id, benefit.id))
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert CompanyBenefit.objects.count() == 1
    
    # --- REORDER BENEFITS ---
    
    def test_reorder_benefits_success(self, api_client, company_owner, company, category):
        """PATCH /api/companies/:id/benefits/reorder/ - Thành công"""
        api_client.force_authenticate(user=company_owner)
        
        # Tạo 3 benefits
        b1 = CompanyBenefit.objects.create(company=company, category=category, benefit_name="B1", display_order=0)
        b2 = CompanyBenefit.objects.create(company=company, category=category, benefit_name="B2", display_order=1)
        b3 = CompanyBenefit.objects.create(company=company, category=category, benefit_name="B3", display_order=2)
        
        # Reorder: B3 -> B1 -> B2
        data = {
            'benefit_ids': [b3.id, b1.id, b2.id]
        }
        response = api_client.patch(benefits_reorder(company.id), data, format='json')
        assert response.status_code == status.HTTP_200_OK
        
        # Verify order
        b1.refresh_from_db()
        b2.refresh_from_db()
        b3.refresh_from_db()
        assert b3.display_order == 0
        assert b1.display_order == 1
        assert b2.display_order == 2
    
    def test_reorder_benefits_not_owner(self, api_client, other_user, company, benefit):
        """PATCH /api/companies/:id/benefits/reorder/ - Không phải owner -> 403"""
        api_client.force_authenticate(user=other_user)
        data = {
            'benefit_ids': [benefit.id]
        }
        response = api_client.patch(benefits_reorder(company.id), data, format='json')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_reorder_benefits_invalid_ids(self, api_client, company_owner, company, benefit):
        """PATCH /api/companies/:id/benefits/reorder/ - IDs không hợp lệ"""
        api_client.force_authenticate(user=company_owner)
        data = {
            'benefit_ids': [benefit.id, 9999]  # 9999 không tồn tại
        }
        response = api_client.patch(benefits_reorder(company.id), data, format='json')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
