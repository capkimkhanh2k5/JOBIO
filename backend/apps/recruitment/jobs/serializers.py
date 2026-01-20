from rest_framework import serializers
from .models import Job


class JobListSerializer(serializers.ModelSerializer):
    """
        Serializer cho danh sách jobs (compact, cho listing)
    """
    
    company_id = serializers.IntegerField(source='company.id', read_only=True)
    company_name = serializers.CharField(source='company.company_name', read_only=True)
    category_id = serializers.IntegerField(source='category.id', read_only=True, allow_null=True)
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Job
        fields = [
            'id', 'title', 'slug', 
            'company_id', 'company_name',
            'category_id', 'category_name',
            'job_type', 'level',
            'salary_min', 'salary_max', 'salary_currency', 'is_salary_negotiable',
            'is_remote', 'status', 'published_at', 'application_deadline'
        ]
        read_only_fields = ['id', 'slug', 'published_at']


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
    title = serializers.CharField(max_length=255, required=True)
    job_type = serializers.ChoiceField(choices=['full-time', 'part-time', 'contract', 'internship', 'freelance'], required=True)
    level = serializers.ChoiceField(choices=['intern', 'fresher', 'junior', 'middle', 'senior', 'lead', 'manager', 'director'], required=True)
    description = serializers.CharField(required=True)
    requirements = serializers.CharField(required=True)
    
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
