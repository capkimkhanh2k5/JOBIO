import { Link } from 'react-router-dom';

/** Generic stub page for employer routes not yet implemented */
function StubPage({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-3xl">
                🚧
            </div>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="text-muted-foreground max-w-sm">{desc}</p>
            <Link
                to="/employer/dashboard"
                className="text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors"
            >
                ← Quay lại Dashboard
            </Link>
        </div>
    );
}

export function EmployerCompanyPage() {
    return <StubPage title="Hồ sơ công ty" desc="Quản lý thông tin, hình ảnh và văn hóa công ty của bạn. Coming soon." />;
}

export function EmployerSettingsPage() {
    return <StubPage title="Cài đặt" desc="Cài đặt tài khoản, thông báo và bảo mật. Coming soon." />;
}

export function EmployerCVSearchPage() {
    return <StubPage title="Tìm CV" desc="Tìm kiếm hồ sơ ứng viên phù hợp với yêu cầu của bạn. Coming soon." />;
}

export function EmployerInterviewsPage() {
    return <StubPage title="Phỏng vấn" desc="Lên lịch và quản lý buổi phỏng vấn với ứng viên. Coming soon." />;
}

export function EmployerMessagesPage() {
    return <StubPage title="Tin nhắn" desc="Giao tiếp trực tiếp với ứng viên qua tin nhắn. Coming soon." />;
}

export function EmployerAnalyticsPage() {
    return <StubPage title="Báo cáo & Phân tích" desc="Báo cáo hiệu quả tuyển dụng chi tiết theo thời gian. Coming soon." />;
}

export function EmployerCampaignsPage() {
    return <StubPage title="Campaigns" desc="Quản lý chiến dịch tuyển dụng quy mô lớn. Coming soon." />;
}

export function EmployerSubscriptionPage() {
    return <StubPage title="Gói dịch vụ" desc="Nâng cấp gói để mở rộng khả năng tiếp cận ứng viên. Coming soon." />;
}

export function EmployerSupportPage() {
    return <StubPage title="Hỗ trợ" desc="Trung tâm hỗ trợ và giải đáp thắc mắc. Coming soon." />;
}
