from rest_framework import serializers
from .models import Job


class JobListSerializer(serializers.ModelSerializer):
    """
        Serializer cho danh sách jobs (compact, cho listing)
    """
    
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_slug = serializers.CharField(source='company.slug', read_only=True, allow_null=True)
    logo_url = serializers.CharField(source='company.logo_url', read_only=True, allow_null=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    views_count = serializers.IntegerField(source='view_count', read_only=True)
    applications_count = serializers.IntegerField(source='application_count', read_only=True)
    salary_negotiable = serializers.BooleanField(source='is_salary_negotiable', read_only=True)
    is_salary_visible = serializers.SerializerMethodField()
    is_featured = serializers.BooleanField(source='featured', read_only=True)
    deadline = serializers.DateField(source='application_deadline', read_only=True, allow_null=True)
    location = serializers.SerializerMethodField()
    locations = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 
            'company_id', 'company_name', 'company_slug', 'logo_url',
            'category_id', 'category_name',
            'job_type', 'level', 'experience_years_min', 'experience_years_max',
            'salary_min', 'salary_max', 'salary_currency', 'salary_type',
            'is_salary_negotiable', 'salary_negotiable', 'is_salary_visible',
            'number_of_positions', 'description', 'requirements', 'benefits',
            'is_remote', 'status', 'published_at', 'created_at', 'application_deadline', 'deadline',
            'view_count', 'application_count', 'views_count', 'applications_count',
            'featured', 'is_featured', 'featured_until',
            'location', 'locations', 'skills'
        ]
        read_only_fields = ['id', 'slug', 'published_at']

    def get_is_salary_visible(self, obj):
        return not obj.is_salary_negotiable and (
            obj.salary_min is not None or obj.salary_max is not None
        )

    def get_location(self, obj):
        return self.get_locations(obj)

    def get_locations(self, obj):
        if obj.address and hasattr(obj.address, 'province') and obj.address.province:
            return obj.address.province.province_name
        return "Toàn quốc"


    def get_skills(self, obj):
        return [
            {
                'id': job_skill.skill_id,
                'name': job_skill.skill.name,
                'is_required': job_skill.is_required,
                'proficiency_level': job_skill.proficiency_level,
                'years_required': job_skill.years_required,
            }
            for job_skill in obj.required_skills.all()
            if job_skill.skill_id and job_skill.skill
        ]


class JobDetailSerializer(serializers.ModelSerializer):
    """
        Serializer cho chi tiết job (full, cho detail view)
    """
    
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    company_logo = serializers.CharField(source='company.logo_url', read_only=True, allow_null=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug',
            'company_id', 'company_name', 'company_logo',
            'category_id', 'category_name',
            'job_type', 'level',
            'experience_years_min', 'experience_years_max',
            'salary_min', 'salary_max', 'salary_currency', 'salary_type', 'is_salary_negotiable',
            'number_of_positions', 'description', 'requirements', 'benefits',
            'seo_title', 'seo_description', 'seo_keywords',
            'is_remote', 'application_deadline',
            'status', 'view_count', 'application_count',
            'featured', 'featured_until',
            'published_at', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'slug', 'view_count', 'application_count', 
            'published_at', 'created_at', 'updated_at'
        ]


class JobCreateSerializer(serializers.Serializer):
    """
        Serializer cho tạo mới job
    """
    
    # Required
    company_id = serializers.IntegerField(required=True)
    job_type = serializers.ChoiceField(choices=['full-time', 'part-time', 'contract', 'internship', 'freelance'], required=True)
    level = serializers.ChoiceField(choices=['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'], required=True)
    
    # Optional / Partial Draft Support
    title = serializers.CharField(max_length=255, required=False, allow_blank=True, default='Tin tuyển dụng mới')
    description = serializers.CharField(required=False, allow_blank=True, default='')
    requirements = serializers.CharField(required=False, allow_blank=True, default='')
    status = serializers.ChoiceField(choices=['draft', 'published', 'closed', 'expired'], required=False, default='draft')
    
    # Optional
    category_id = serializers.IntegerField(required=False, allow_null=True)
    experience_years_min = serializers.IntegerField(required=False, default=0)
    experience_years_max = serializers.IntegerField(required=False, allow_null=True)
    salary_min = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    salary_max = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    salary_currency = serializers.CharField(max_length=10, required=False, default='VND')
    salary_type = serializers.ChoiceField(choices=['monthly', 'yearly', 'hourly', 'project'], required=False, default='monthly')
    is_salary_negotiable = serializers.BooleanField(required=False, default=False)
    number_of_positions = serializers.IntegerField(required=False, default=1)
    benefits = serializers.CharField(required=False, allow_blank=True)
    seo_title = serializers.CharField(max_length=70, required=False, allow_blank=True, default='')
    seo_description = serializers.CharField(max_length=160, required=False, allow_blank=True, default='')
    seo_keywords = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    is_remote = serializers.BooleanField(required=False, default=False)
    application_deadline = serializers.DateField(required=False, allow_null=True)
    
    def validate(self, attrs):
        # Validate salary_max >= salary_min
        salary_min = attrs.get('salary_min')
        salary_max = attrs.get('salary_max')
        if salary_min and salary_max and salary_max < salary_min:
            raise serializers.ValidationError({
                "salary_max": "Salary max must be >= salary min"
            })
        
        # Validate experience_years_max >= experience_years_min
        exp_min = attrs.get('experience_years_min', 0)
        exp_max = attrs.get('experience_years_max')
        if exp_max is not None and exp_max < exp_min:
            raise serializers.ValidationError({
                "experience_years_max": "Max experience must be >= min experience"
            })
        
        return attrs


class JobUpdateSerializer(serializers.Serializer):
    """
        Serializer cho cập nhật job (partial update)
    """
    
    title = serializers.CharField(max_length=255, required=False)
    category_id = serializers.IntegerField(required=False, allow_null=True)
    job_type = serializers.ChoiceField(choices=['full-time', 'part-time', 'contract', 'internship', 'freelance'], required=False)
    level = serializers.ChoiceField(choices=['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'], required=False)
    experience_years_min = serializers.IntegerField(required=False)
    experience_years_max = serializers.IntegerField(required=False, allow_null=True)
    salary_min = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    salary_max = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, allow_null=True)
    salary_currency = serializers.CharField(max_length=10, required=False)
    salary_type = serializers.ChoiceField(choices=['monthly', 'yearly', 'hourly', 'project'], required=False)
    is_salary_negotiable = serializers.BooleanField(required=False)
    number_of_positions = serializers.IntegerField(required=False)
    description = serializers.CharField(required=False)
    requirements = serializers.CharField(required=False)
    benefits = serializers.CharField(required=False, allow_blank=True)
    seo_title = serializers.CharField(max_length=70, required=False, allow_blank=True)
    seo_description = serializers.CharField(max_length=160, required=False, allow_blank=True)
    seo_keywords = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    is_remote = serializers.BooleanField(required=False)
    application_deadline = serializers.DateField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=['draft', 'published', 'closed', 'expired'], required=False)
    
    def validate(self, attrs):
        salary_min = attrs.get('salary_min')
        salary_max = attrs.get('salary_max')
        if salary_min and salary_max and salary_max < salary_min:
            raise serializers.ValidationError({
                "salary_max": "Salary max must be >= salary min"
            })
        return attrs


class JobStatusSerializer(serializers.Serializer):
    """
        Serializer cho thay đổi trạng thái job
    """
    
    status = serializers.ChoiceField(
        choices=['draft', 'published', 'closed', 'expired'],
        required=True
    )

class AdminJobSerializer(JobListSerializer):
    """
    Serializer cho danh sách jobs phía Admin (thêm email)
    """
    user_email = serializers.CharField(source='company.user.email', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta(JobListSerializer.Meta):
        fields = JobListSerializer.Meta.fields + ['user_email', 'created_by_email', 'created_at']
