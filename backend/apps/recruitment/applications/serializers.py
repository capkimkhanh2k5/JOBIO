from rest_framework import serializers
from .models import Application

from apps.recruitment.jobs.models import Job
from apps.candidate.recruiter_cvs.models import RecruiterCV
from apps.candidate.recruiter_skills.models import RecruiterSkill


class ApplicationListSerializer(serializers.ModelSerializer):
    """
    Serializer compact cho danh sách applications
    """

    recruiter_id = serializers.IntegerField(source="recruiter.id", read_only=True)
    recruiter_name = serializers.CharField(
        source="recruiter.user.full_name", read_only=True
    )
    recruiter_email = serializers.CharField(
        source="recruiter.user.email", read_only=True
    )
    job_title = serializers.CharField(source="job.title", read_only=True)

    recruiter_avatar = serializers.URLField(
        source="recruiter.user.avatar_url", read_only=True
    )
    company_name = serializers.CharField(
        source="job.company.company_name", read_only=True
    )
    company_logo = serializers.URLField(source="job.company.logo_url", read_only=True)
    ai_score = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()
    cv_url = serializers.CharField(source="cv.cv_url", read_only=True, allow_null=True)
    cv_name = serializers.CharField(
        source="cv.cv_name", read_only=True, allow_null=True
    )
    cv_id = serializers.IntegerField(source="cv.id", read_only=True, allow_null=True)
    cv_template_id = serializers.IntegerField(
        source="cv.template_id", read_only=True, allow_null=True
    )

    class Meta:
        model = Application
        fields = [
            "id",
            "job_id",
            "job_title",
            "company_name",
            "company_logo",
            "recruiter_id",
            "recruiter_name",
            "recruiter_email",
            "recruiter_avatar",
            "status",
            "rating",
            "ai_score",
            "match_score",
            "skills",
            "cv_url",
            "cv_name",
            "cv_id",
            "cv_template_id",
            "applied_at",
            "updated_at",
        ]
        read_only_fields = ["id", "applied_at", "updated_at"]

    def _get_match_score(self, obj):
        if hasattr(obj, "_jobio_match_score"):
            return obj._jobio_match_score

        try:
            from apps.recruitment.jobs.selectors.jobs import (
                calculate_cv_job_match_score,
            )

            score = calculate_cv_job_match_score(obj.cv, obj.recruiter, obj.job)
        except Exception:
            score = 0

        obj._jobio_match_score = score
        return score

    def get_ai_score(self, obj):
        return self._get_match_score(obj)

    def get_match_score(self, obj):
        return self._get_match_score(obj)

    def get_skills(self, obj):
        try:
            prefetched = getattr(obj.recruiter, "_prefetched_objects_cache", {})
            if "skills" in prefetched:
                return [
                    recruiter_skill.skill.name
                    for recruiter_skill in obj.recruiter.skills.all()
                    if recruiter_skill.skill_id and recruiter_skill.skill
                ]

            skill_names = RecruiterSkill.objects.filter(
                recruiter=obj.recruiter
            ).values_list("skill__name", flat=True)
            return list(skill_names)
        except Exception:
            return []


class ApplicationDetailSerializer(serializers.ModelSerializer):
    """
    Serializer chi tiết cho application
    """

    recruiter_id = serializers.IntegerField(source="recruiter.id", read_only=True)
    recruiter_name = serializers.CharField(
        source="recruiter.user.full_name", read_only=True
    )
    recruiter_email = serializers.CharField(
        source="recruiter.user.email", read_only=True
    )
    job_id = serializers.IntegerField(source="job.id", read_only=True)
    job_title = serializers.CharField(source="job.title", read_only=True)
    cv_url = serializers.CharField(source="cv.cv_url", read_only=True, allow_null=True)
    cv_name = serializers.CharField(
        source="cv.cv_name", read_only=True, allow_null=True
    )
    cv_id = serializers.IntegerField(source="cv.id", read_only=True, allow_null=True)
    cv_template_id = serializers.IntegerField(
        source="cv.template_id", read_only=True, allow_null=True
    )
    reviewed_by_name = serializers.CharField(
        source="reviewed_by.full_name", read_only=True, allow_null=True
    )
    recruiter_avatar = serializers.URLField(
        source="recruiter.user.avatar_url", read_only=True
    )
    recruiter_phone = serializers.CharField(
        source="recruiter.user.phone", read_only=True
    )
    ai_score = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    skills = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            "id",
            "job_id",
            "job_title",
            "recruiter_id",
            "recruiter_name",
            "recruiter_email",
            "recruiter_avatar",
            "recruiter_phone",
            "cv_url",
            "cv_name",
            "cv_id",
            "cv_template_id",
            "cover_letter",
            "status",
            "rating",
            "notes",
            "ai_score",
            "match_score",
            "skills",
            "applied_at",
            "updated_at",
            "reviewed_by_name",
            "reviewed_at",
        ]
        read_only_fields = ["id", "applied_at", "updated_at"]

    def _get_match_score(self, obj):
        if hasattr(obj, "_jobio_match_score"):
            return obj._jobio_match_score

        try:
            from apps.recruitment.jobs.selectors.jobs import (
                calculate_cv_job_match_score,
            )

            score = calculate_cv_job_match_score(obj.cv, obj.recruiter, obj.job)
        except Exception:
            score = 0

        obj._jobio_match_score = score
        return score

    def get_ai_score(self, obj):
        return self._get_match_score(obj)

    def get_match_score(self, obj):
        return self._get_match_score(obj)

    def get_skills(self, obj):
        try:
            prefetched = getattr(obj.recruiter, "_prefetched_objects_cache", {})
            if "skills" in prefetched:
                return [
                    recruiter_skill.skill.name
                    for recruiter_skill in obj.recruiter.skills.all()
                    if recruiter_skill.skill_id and recruiter_skill.skill
                ]

            skill_names = RecruiterSkill.objects.filter(
                recruiter=obj.recruiter
            ).values_list("skill__name", flat=True)
            return list(skill_names)
        except Exception:
            return []


class ApplicationCreateSerializer(serializers.Serializer):
    """
    Serializer cho tạo application (nộp đơn ứng tuyển)
    """

    job_id = serializers.IntegerField(required=True)
    cv_id = serializers.IntegerField(required=False, allow_null=True)
    cover_letter = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )

    def validate_job_id(self, value):
        try:
            job = Job.objects.get(id=value)
            if job.status != "published":
                raise serializers.ValidationError("This job is not available!")
            return value
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job not found!")

    def validate_cv_id(self, value):
        if value is None:
            return value

        if not RecruiterCV.objects.filter(id=value).exists():
            raise serializers.ValidationError("CV not found!")
        return value


class ApplicationUpdateSerializer(serializers.Serializer):
    """
    Serializer cho cập nhật application (bởi ứng viên)
    """

    cv_id = serializers.IntegerField(required=False, allow_null=True)
    cover_letter = serializers.CharField(
        required=False, allow_null=True, allow_blank=True
    )

    def validate_cv_id(self, value):
        if value is None:
            return value

        if not RecruiterCV.objects.filter(id=value).exists():
            raise serializers.ValidationError("CV not found!")
        return value


class ApplicationStatusSerializer(serializers.Serializer):
    """
    Serializer cho thay đổi status (bởi job owner)
    """

    status = serializers.ChoiceField(
        choices=[
            ("reviewing", "Đang xem xét"),
            ("shortlisted", "Vào vòng tiếp"),
            ("interview", "Phỏng vấn"),
            ("offered", "Đề xuất offer"),
            ("rejected", "Từ chối"),
            ("accepted", "Đã nhận việc"),
        ],
        required=True,
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationRatingSerializer(serializers.Serializer):
    """
    Serializer cho đánh giá ứng viên (bởi job owner)
    """

    rating = serializers.IntegerField(min_value=1, max_value=5, required=True)
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationNotesSerializer(serializers.Serializer):
    """
    Serializer cho thêm ghi chú vào application
    """

    notes = serializers.CharField(required=True, allow_blank=False)


class ApplicationRejectSerializer(serializers.Serializer):
    """
    Serializer cho từ chối ứng viên
    """

    reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationOfferSerializer(serializers.Serializer):
    """
    Serializer cho gửi offer
    """

    offer_details = serializers.CharField(required=True)
    salary = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    start_date = serializers.DateField(required=False, allow_null=True)


class ApplicationWithdrawSerializer(serializers.Serializer):
    """
    Serializer cho ứng viên rút đơn
    """

    reason = serializers.CharField(required=False, allow_null=True, allow_blank=True)


class ApplicationBulkActionSerializer(serializers.Serializer):
    """
    Serializer cho thao tác hàng loạt
    """

    application_ids = serializers.ListField(
        child=serializers.IntegerField(), required=True, min_length=1
    )
    action = serializers.ChoiceField(
        choices=["reject", "shortlist", "delete"], required=True
    )
    notes = serializers.CharField(required=False, allow_null=True, allow_blank=True)
