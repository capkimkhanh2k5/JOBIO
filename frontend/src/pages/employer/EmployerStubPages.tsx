import { Link } from 'react-router-dom';

/** Generic stub page for employer routes not yet implemented */
function StubPage({ title, desc }: { title: string; desc: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-3xl shadow-sm border border-violet-100">
                🚧
            </div>
            <h1 className="text-2xl font-black text-slate-900">{title}</h1>
            <p className="text-slate-500 max-w-sm font-medium">{desc}</p>
            <Link
                to="/employer/dashboard"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
            >
                ← Quay lại Dashboard
            </Link>
        </div>
    );
}

// Removed EmployerCompanyPage as it is implemented





// export function EmployerInterviewsPage() {
//     return <StubPage title="Phỏng vấn" desc="Lên lịch và quản lý buổi phỏng vấn với ứng viên. Coming soon." />;
// }

export function EmployerMessagesPage() {
    return <StubPage title="Tin nhắn" desc="Giao tiếp trực tiếp với ứng viên qua tin nhắn. Coming soon." />;
}

// Removed EmployerSupportPage as it is implemented
