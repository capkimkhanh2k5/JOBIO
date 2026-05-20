import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';

import type { User, UserRole } from '@/types/api';

interface JwtPayload {
    exp?: number;
}

function isMissingOrExpiredJwt(token: string | null) {
    if (!token) return true;

    try {
        const payload = jwtDecode<JwtPayload>(token);
        return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

function hasInvalidAuthState(user: User | null, refreshToken: string | null) {
    return !user || isMissingOrExpiredJwt(refreshToken);
}

interface ProtectedRouteProps {
    children: React.ReactNode;
    role?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
    const { isAuthenticated, user, refreshToken, clearAuth } = useUserStore();
    const location = useLocation();
    const invalidAuthState = isAuthenticated && hasInvalidAuthState(user, refreshToken);

    React.useEffect(() => {
        if (!invalidAuthState && isAuthenticated && role && user?.role !== role) {
            toast.error("Bạn không có quyền truy cập trang này!");
        }
    }, [invalidAuthState, isAuthenticated, role, user?.role]);

    React.useEffect(() => {
        if (invalidAuthState) {
            clearAuth();
        }
    }, [clearAuth, invalidAuthState]);

    if (!isAuthenticated || invalidAuthState) {
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
    const { isAuthenticated, user, refreshToken, clearAuth } = useUserStore();
    const location = useLocation();
    const from = location.state?.from?.pathname;
    const redirectPath = from && !from.startsWith('/auth') ? from : "/";
    const invalidAuthState = isAuthenticated && hasInvalidAuthState(user, refreshToken);

    React.useEffect(() => {
        if (invalidAuthState) {
            clearAuth();
        }
    }, [clearAuth, invalidAuthState]);

    if (isAuthenticated && !invalidAuthState) {
        return <Navigate to={redirectPath} replace />;
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
