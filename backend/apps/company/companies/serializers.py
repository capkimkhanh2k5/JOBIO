from rest_framework import serializers
from .models import Company, CompanyMember
from apps.company.industries.models import Industry
from apps.core.validators import validate_https_url
from apps.geography.addresses.serializers import AddressDetailSerializer


class CompanySerializer(serializers.ModelSerializer):
    """Serializer cho đọc dữ liệu Company (List/Detail)"""

    industry_name = serializers.CharField(source="industry.name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    address = AddressDetailSerializer(read_only=True)

    class Meta:
        model = Company
        fields = [
            "id",
            "company_name",
            "slug",
            "tax_code",
            "company_size",
            "industry",
            "industry_name",
            "website",
            "logo_url",
            "banner_url",
            "description",
            "email",
            "phone",
            "address",
            "headquarters",
            "founded_year",
            "verification_status",
            "verified_at",
            "follower_count",
            "job_count",
            "user",
            "user_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "slug",
            "verification_status",
            "verified_at",
            "verified_by",
            "follower_count",
            "job_count",
            "user",
            "created_at",
            "updated_at",
        ]


class CompanyCreateSerializer(serializers.Serializer):
    """Serializer cho tạo mới Company"""

    company_name = serializers.CharField(max_length=255)
    slug = serializers.SlugField(max_length=255, required=False, allow_blank=True)
    tax_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    company_size = serializers.ChoiceField(
        choices=Company.CompanySize.choices, required=False, allow_blank=True
    )
    industry_id = serializers.IntegerField(required=False, allow_null=True)
    website = serializers.URLField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    founded_year = serializers.IntegerField(required=False, allow_null=True)

    def validate_slug(self, value):
        """Kiểm tra slug unique nếu được cung cấp"""
        if value and Company.objects.filter(slug=value).exists():
            raise serializers.ValidationError("Slug này đã tồn tại")
        return value

    def validate_industry_id(self, value):
        """Kiểm tra industry tồn tại"""
        if value and not Industry.objects.filter(id=value).exists():
            raise serializers.ValidationError("Ngành nghề không tồn tại")
        return value

    def validate_website(self, value):
        return validate_https_url(value)

    def validate_tax_code(self, value):
        """Kiểm tra tax_code unique nếu được cung cấp"""
        if value and Company.objects.filter(tax_code=value).exists():
            raise serializers.ValidationError("Mã số thuế đã được sử dụng")
        return value


class CompanyUpdateSerializer(serializers.Serializer):
    """Serializer cho cập nhật Company"""

    company_name = serializers.CharField(max_length=255, required=False)
    tax_code = serializers.CharField(max_length=50, required=False, allow_blank=True)
    company_size = serializers.ChoiceField(
        choices=Company.CompanySize.choices, required=False, allow_blank=True
    )
    industry_id = serializers.IntegerField(required=False, allow_null=True)
    website = serializers.URLField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    headquarters = serializers.CharField(
        max_length=500, required=False, allow_blank=True
    )
    founded_year = serializers.IntegerField(required=False, allow_null=True)

    def validate_industry_id(self, value):
        if value and not Industry.objects.filter(id=value).exists():
            raise serializers.ValidationError("Ngành nghề không tồn tại")
        return value

    def validate_website(self, value):
        return validate_https_url(value)


class JobListSerializer(serializers.Serializer):
    """Serializer danh sách Jobs của Company"""

    id = serializers.IntegerField(read_only=True)
    title = serializers.CharField(read_only=True)
    slug = serializers.CharField(read_only=True)
    job_type = serializers.CharField(read_only=True)
    level = serializers.CharField(read_only=True)
    salary_min = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    salary_max = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    is_remote = serializers.BooleanField(read_only=True)
    application_deadline = serializers.DateField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)


class CompanyFollowerSerializer(serializers.Serializer):
    """Serializer danh sách Followers của Company"""

    id = serializers.IntegerField(read_only=True)
    recruiter_id = serializers.IntegerField(source="recruiter.id", read_only=True)
    recruiter_name = serializers.CharField(
        source="recruiter.user.full_name", read_only=True
    )
    created_at = serializers.DateTimeField(read_only=True)


class CompanyStatsSerializer(serializers.Serializer):
    """Serializer thống kê Company"""

    job_count = serializers.IntegerField()
    follower_count = serializers.IntegerField()
    application_count = serializers.DictField()


class CompanyMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    invited_by_email = serializers.EmailField(source="invited_by.email", read_only=True)

    class Meta:
        model = CompanyMember
        fields = [
            "id",
            "company",
            "user",
            "user_email",
            "user_name",
            "role",
            "status",
            "invited_by",
            "invited_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "company",
            "user_email",
            "user_name",
            "invited_by",
            "invited_by_email",
            "created_at",
            "updated_at",
        ]


class CompanyMemberWriteSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=False)
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(
        choices=[
            CompanyMember.Role.ADMIN,
            CompanyMember.Role.RECRUITER,
            CompanyMember.Role.VIEWER,
        ],
        default=CompanyMember.Role.RECRUITER,
    )
    status = serializers.ChoiceField(
        choices=CompanyMember.Status.choices,
        default=CompanyMember.Status.ACTIVE,
        required=False,
    )

    def validate(self, attrs):
        if not attrs.get("user_id") and not attrs.get("email"):
            raise serializers.ValidationError("Cần cung cấp user_id hoặc email")
        return attrs
