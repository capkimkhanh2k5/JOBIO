from rest_framework import serializers
from .models import Recruiter
from apps.core.users.serializers import CustomUserSerializer
from apps.candidate.recruiter_experience.serializers import ExperienceSerializer
from apps.candidate.recruiter_education.serializers import EducationSerializer
from apps.candidate.recruiter_skills.serializers import RecruiterSkillSerializer
from apps.candidate.recruiter_certifications.serializers import CertificationSerializer
from apps.candidate.recruiter_languages.serializers import RecruiterLanguageSerializer
from apps.candidate.recruiter_projects.serializers import ProjectSerializer

from .services.recruiters import calculate_profile_completeness_service

from apps.geography.addresses.serializers import AddressDetailSerializer


class RecruiterSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    address = AddressDetailSerializer(read_only=True)
    score = serializers.SerializerMethodField()
    checklist = serializers.SerializerMethodField()
    
    class Meta:
        model = Recruiter
        fields = [
            'id', 'user', 'current_company', 'current_position', 
            'date_of_birth', 'gender', 'address', 'bio', 
            'linkedin_url', 'facebook_url', 'github_url', 'portfolio_url',
            'job_search_status', 'desired_salary_min', 'desired_salary_max', 'salary_currency',
            'available_from_date', 'years_of_experience', 'highest_education_level',
            'profile_completeness_score', 'is_profile_public', 'profile_views_count',
            'created_at', 'updated_at', 'score', 'checklist'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 
            'profile_completeness_score', 'profile_views_count',
            'score', 'checklist'
        ]

    def get_score(self, obj):
        return obj.profile_completeness_score

    def get_checklist(self, obj):
        return calculate_profile_completeness_service(obj).get('checklist', [])

class RecruiterDetailSerializer(RecruiterSerializer):
    """Serializer chi tiết cho Recruiter bao gồm đầy đủ các bảng liên quan"""

    experiences = ExperienceSerializer(many=True, read_only=True)
    education = EducationSerializer(many=True, read_only=True)
    skills = RecruiterSkillSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    languages = RecruiterLanguageSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)

    class Meta:
        model = Recruiter
        fields = [
            'id', 'user', 'current_company', 'current_position', 
            'date_of_birth', 'gender', 'address', 'bio', 
            'linkedin_url', 'facebook_url', 'github_url', 'portfolio_url',
            'job_search_status', 'desired_salary_min', 'desired_salary_max', 'salary_currency',
            'available_from_date', 'years_of_experience', 'highest_education_level',
            'profile_completeness_score', 'is_profile_public', 'profile_views_count',
            'created_at', 'updated_at', 'score', 'checklist',
            'experiences', 'education', 'skills', 
            'certifications', 'languages', 'projects'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 
            'profile_completeness_score', 'profile_views_count',
            'score', 'checklist'
        ]

class RecruiterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruiter
        fields = [
            'current_company', 'current_position', 
            'date_of_birth', 'gender', 'address', 'bio', 
            'linkedin_url', 'facebook_url', 'github_url', 'portfolio_url',
            'job_search_status', 'desired_salary_min', 'desired_salary_max', 'salary_currency',
            'available_from_date', 'years_of_experience', 'highest_education_level',
            'is_profile_public'
        ]

class RecruiterUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(required=False)
    address = serializers.JSONField(required=False)
    
    class Meta:
        model = Recruiter
        fields = [
            'full_name',
            'current_company', 'current_position', 
            'date_of_birth', 'gender', 'address', 'bio', 
            'linkedin_url', 'facebook_url', 'github_url', 'portfolio_url',
            'job_search_status', 'desired_salary_min', 'desired_salary_max', 'salary_currency',
            'available_from_date', 'years_of_experience', 'highest_education_level',
            'is_profile_public'
        ]

class JobSearchStatusSerializer(serializers.Serializer):
    job_search_status = serializers.ChoiceField(choices=Recruiter.JobSearchStatus.choices)

class ProfileCompletenessSerializer(serializers.Serializer):
    score = serializers.IntegerField(read_only=True)
    missing_fields = serializers.ListField(child=serializers.CharField(), read_only=True)

class RecruiterAvatarSerializer(serializers.Serializer):
    avatar = serializers.ImageField(max_length=None, use_url=True)
    
class RecruiterPublicProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Recruiter
        fields = [
            'id', 'user', 'current_company', 'current_position', 
            'bio', 'linkedin_url', 'github_url', 'portfolio_url',
            'years_of_experience', 'highest_education_level',
        ]
        read_only_fields = ['id']

class RecruiterPrivacySerializer(serializers.ModelSerializer):
    class Meta:
        model = Recruiter
        fields = ['is_profile_public']

class RecruiterStatsSerializer(serializers.Serializer):
    profile_views = serializers.IntegerField(read_only=True)
    following_companies = serializers.IntegerField(read_only=True)

class RecruiterSearchFilterSerializer(serializers.Serializer):
    skills = serializers.ListField(child=serializers.CharField())
    location = serializers.CharField()
    min_experience = serializers.IntegerField()
    job_status = serializers.CharField()

class MatchingJobSerializer(serializers.Serializer):
    job_id = serializers.IntegerField()
    job_title = serializers.CharField()
    company_name = serializers.CharField()
    match_score = serializers.IntegerField()

class RecruiterApplicationSerializer(serializers.Serializer):
    """Placeholder cho danh sách đơn ứng tuyển"""
    id = serializers.IntegerField()
    job_title = serializers.CharField()
    company_name = serializers.CharField()
    status = serializers.CharField()
    applied_at = serializers.DateTimeField()

class SavedJobSerializer(serializers.Serializer):
    """Serializer cho danh sách việc làm đã lưu"""
    id = serializers.SerializerMethodField()
    job_id = serializers.SerializerMethodField()
    job_title = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    logo_url = serializers.SerializerMethodField()
    salary = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    saved_at = serializers.SerializerMethodField()
    
    def get_id(self, obj):
        return obj.id
        
    def get_job_id(self, obj):
        return obj.job.id if obj.job else None
    
    def get_job_title(self, obj):
        return obj.job.title if obj.job else None
    
    def get_company_name(self, obj):
        return obj.job.company.company_name if obj.job and obj.job.company else None
        
    def get_logo_url(self, obj):
        return obj.job.company.logo_url if obj.job and obj.job.company and hasattr(obj.job.company, 'logo_url') and obj.job.company.logo_url else None
        
    def get_salary(self, obj):
        if not obj.job: return None
        if obj.job.salary_min and obj.job.salary_max:
            return f"{int(obj.job.salary_min)} - {int(obj.job.salary_max)} {obj.job.salary_currency}"
        elif obj.job.salary_min:
            return f"Từ {int(obj.job.salary_min)} {obj.job.salary_currency}"
        return "Thoả thuận"
        
    def get_location(self, obj):
        if obj.job and getattr(obj.job, 'primary_location', None):
            return obj.job.primary_location.address.province.province_name if obj.job.primary_location.address and obj.job.primary_location.address.province else None
        # Fallback to general area etc if needed
        return None
    
    def get_saved_at(self, obj):
        return obj.created_at