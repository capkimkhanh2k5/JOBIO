"""
Chuẩn hóa Permission Classes cho toàn bộ API.

Tập trung hóa tất cả permission logic để tránh inline checks trong views.
"""
from rest_framework import permissions


class IsCompanyOwner(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là chủ sở hữu công ty (role='company').
    """
    message = "Bạn phải là chủ công ty để thực hiện hành động này."
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'company_profile')
        )

    def has_object_permission(self, request, view, obj):
        # Hỗ trợ nhiều loại object khác nhau
        if hasattr(obj, 'company'):
            return obj.company == request.user.company_profile
        if hasattr(obj, 'company_profile'):
            return obj.company_profile == request.user.company_profile
        return False


class IsRecruiter(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là recruiter (ứng viên).
    """
    message = "Bạn phải là ứng viên để thực hiện hành động này."
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'recruiter_profile')
        )


class IsRecruiterOwner(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là chủ sở hữu của recruiter profile.
    Áp dụng cho: CV, Education, Experience, Skills, etc.
    """
    message = "Bạn không có quyền truy cập tài nguyên này."
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'recruiter_profile')
        )
    
    def has_object_permission(self, request, view, obj):
        # Hỗ trợ nhiều loại object
        if hasattr(obj, 'recruiter'):
            return obj.recruiter == request.user.recruiter_profile
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsApplicationOwner(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là chủ application (recruiter) hoặc company sở hữu job.
    """
    message = "Bạn không có quyền truy cập đơn ứng tuyển này."
    
    def has_object_permission(self, request, view, obj):
        # Recruiter sở hữu application
        if hasattr(request.user, 'recruiter_profile'):
            return obj.recruiter == request.user.recruiter_profile
        
        # Company sở hữu job của application
        if hasattr(request.user, 'company_profile'):
            return obj.job.company == request.user.company_profile
        
        return False


class IsJobOwner(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là company sở hữu job.
    """
    message = "Bạn không có quyền quản lý công việc này."
    
    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'company_profile'):
            return obj.company == request.user.company_profile
        return False


class IsJobOwnerOrReadOnly(permissions.BasePermission):
    """
    Cho phép đọc (GET, HEAD, OPTIONS) cho mọi người.
    Chỉ company sở hữu job mới được sửa/xóa.
    """
    message = "Bạn không có quyền sửa công việc này."
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        if hasattr(request.user, 'company_profile'):
            return obj.company == request.user.company_profile
        return False


class IsInterviewParticipant(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là interviewer hoặc recruiter của interview.
    """
    message = "Bạn không có quyền truy cập buổi phỏng vấn này."
    
    def has_object_permission(self, request, view, obj):
        # Company owner
        if hasattr(request.user, 'company_profile'):
            return obj.application.job.company == request.user.company_profile
        
        # Recruiter (ứng viên)
        if hasattr(request.user, 'recruiter_profile'):
            return obj.application.recruiter == request.user.recruiter_profile
        
        return False


class IsAdmin(permissions.BasePermission):
    """
    Chỉ admin mới được truy cập.
    """
    message = "Chỉ admin mới có quyền thực hiện hành động này."
    
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.is_staff
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Cho phép đọc cho mọi người.
    Chỉ admin mới được sửa/xóa.
    """
    message = "Chỉ admin mới có quyền sửa đổi."
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Cho phép truy cập nếu là chủ sở hữu hoặc admin.
    Object phải có trường 'user' hoặc 'owner'.
    """
    message = "Bạn không có quyền thực hiện hành động này."
    
    def has_object_permission(self, request, view, obj):
        # Admin có full quyền
        if request.user.is_staff:
            return True
        
        # Owner
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return False


class IsReviewOwner(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là tác giả review.
    """
    message = "Bạn không có quyền sửa đánh giá này."
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'reviewer'):
            return obj.reviewer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsMessageParticipant(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là participant của message thread.
    """
    message = "Bạn không có quyền truy cập cuộc hội thoại này."
    
    def has_object_permission(self, request, view, obj):
        # For MessageThread
        if hasattr(obj, 'participants'):
            return obj.participants.filter(user=request.user).exists()
        
        # For Message (check parent thread)
        if hasattr(obj, 'thread'):
            return obj.thread.participants.filter(user=request.user).exists()
        
        return False


class IsNotificationOwner(permissions.BasePermission):
    """
    Cho phép truy cập nếu user là recipient của notification.
    """
    message = "Bạn không có quyền truy cập thông báo này."
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class CanModerateReview(permissions.BasePermission):
    """
    Cho phép moderate review nếu là admin hoặc company được review.
    """
    message = "Bạn không có quyền moderate đánh giá này."
    
    def has_object_permission(self, request, view, obj):
        # Admin
        if request.user.is_staff:
            return True
        
        # Company được review
        if hasattr(request.user, 'company_profile') and hasattr(obj, 'company'):
            return obj.company == request.user.company_profile
        
        return False


class HasActiveSubscription(permissions.BasePermission):
    """
    Cho phép truy cập nếu company có subscription đang active.
    Áp dụng cho premium features.
    """
    message = "Bạn cần có gói đăng ký để sử dụng tính năng này."
    
    def has_permission(self, request, view):
        if not hasattr(request.user, 'company_profile'):
            return False
        
        from apps.billing.models import CompanySubscription
        return CompanySubscription.objects.filter(
            company=request.user.company_profile,
            status=CompanySubscription.Status.ACTIVE
        ).exists()


class IsAuthenticatedOrReadOnly(permissions.BasePermission):
    """
    Cho phép đọc cho mọi người, yêu cầu auth để write.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)
