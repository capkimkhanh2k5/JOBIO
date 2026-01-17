from rest_framework import serializers
from apps.social.company_followers.models import CompanyFollower
from apps.company.companies.serializers import CompanySerializer

class CompanyFollowerSerializer(serializers.ModelSerializer):
    """Serializer cho model CompanyFollower"""
    company_detail = CompanySerializer(source='company', read_only=True)
    
    class Meta:
        model = CompanyFollower
        fields = ['id', 'company', 'company_detail', 'recruiter', 'created_at']
        read_only_fields = ['id', 'created_at']
