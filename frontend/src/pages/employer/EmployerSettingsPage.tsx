
import { useSearchParams } from 'react-router-dom';
import { User, ShieldCheck, BellRing } from 'lucide-react';
import { SettingsLayout, SettingsTab } from '@/components/shared/settings/SettingsLayout';
import { AccountSettings } from '@/components/shared/settings/AccountSettings';
import { SecuritySettings } from '@/components/shared/settings/SecuritySettings';
import { NotificationSettings } from '@/components/shared/settings/NotificationSettings';

const EMPLOYER_TABS: SettingsTab[] = [
    { id: 'account', label: 'Tài khoản', icon: User },
    { id: 'security', label: 'Bảo mật', icon: ShieldCheck },
    { id: 'notifications', label: 'Thông báo', icon: BellRing },
];

export function EmployerSettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'account';

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    return (
        <SettingsLayout
            title="Cài đặt nhà tuyển dụng"
            description="Quản lý tài khoản doanh nghiệp, bảo mật và tuỳ chỉnh thông báo của bạn."
            tabs={EMPLOYER_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
        >
            {activeTab === 'account' && <AccountSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
        </SettingsLayout>
    );
}
