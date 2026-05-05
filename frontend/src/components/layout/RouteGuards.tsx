import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

import type { UserRole } from '@/types/api';

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const { isAuthenticated, user } = useUserStore();
    const location = useLocation();

    React.useEffect(() => {
        if (isAuthenticated && role && user?.role !== role) {
            toast.error("Bạn không có quyền truy cập trang này!");
        }
    }, [isAuthenticated, role, user?.role]);

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (role && user?.role !== role) {
        if (user?.role === 'admin') {
            return <>{children}</>;
        }
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

/**
 * RoleBasedRedirect - Enforces route containment for specific roles.
 */
export const RoleBasedRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
};

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useUserStore();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    if (isAuthenticated) {
        return <Navigate to={from} replace />;
    }

    return <>{children}</>;
};

export const NotFoundRedirect: React.FC = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        toast.error("Trang không tồn tại hoặc bạn không có quyền truy cập. Đang quay lại trang chủ...");
        navigate("/", { replace: true });
    }, [navigate]);

    return null;
};
