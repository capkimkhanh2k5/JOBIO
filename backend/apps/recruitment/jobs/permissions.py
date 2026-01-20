from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsJobOwnerOrReadOnly(BasePermission):
    """
    Permission: 
    - GET (SAFE_METHODS) → Public (AllowAny)
    - POST → Authenticated + User phải là owner của company
    - PUT → Authenticated + User phải là owner của company sở hữu job
    """
    
    def has_permission(self, request, view):
        # GET, HEAD, OPTIONS là public
        if request.method in SAFE_METHODS:
            return True
        # POST, PUT, DELETE yêu cầu xác thực
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # GET là public
        if request.method in SAFE_METHODS:
            return True
        
        # PUT/DELETE: User phải là owner của company sở hữu job
        # Kiểm tra nếu user là owner của company sở hữu job
        if hasattr(obj, 'company') and obj.company:
            return obj.company.user == request.user
        
        return False
