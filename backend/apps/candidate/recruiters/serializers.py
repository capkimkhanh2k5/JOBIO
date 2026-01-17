from rest_framework import serializers
from .models import Recruiter
from apps.core.users.serializers import CustomUserSerializer

# TODO: Define new serializers for Extended APIs
# 1. ProfileCompletenessSerializer
#    - Fields: score (int), missing_fields (list[str])
# 2. RecruiterAvatarSerializer
#    - Fields: avatar (FileField/ImageField)
#    - Validation: Max size 5MB, formats [jpg, png]
# 3. RecruiterPublicProfileSerializer
#    - Fields: Safe fields only (Name, Bio, Position, Experience, Skills, LinkedIn...)
#    - Exclude: Phone, Email, Salary info
# 4. RecruiterPrivacySerializer
#    - Fields: is_profile_public (bool)
# 5. RecruiterStatsSerializer
#    - Fields: profile_views (int), following_companies_count (int)

class RecruiterSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    
    class Meta:
        model = Recruiter
        fields = [
            'id', 'user', 'current_company', 'current_position', 
            'date_of_birth', 'gender', 'address', 'bio', 
            'linkedin_url', 'facebook_url', 'github_url', 'portfolio_url',
            'job_search_status', 'desired_salary_min', 'desired_salary_max', 'salary_currency',
            'available_from_date', 'years_of_experience', 'highest_education_level',
            'profile_completeness_score', 'is_profile_public', 'profile_views_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 
            'profile_completeness_score', 'profile_views_count'
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

class JobSearchStatusSerializer(serializers.Serializer):
    job_search_status = serializers.ChoiceField(choices=Recruiter.JobSearchStatus.choices)
