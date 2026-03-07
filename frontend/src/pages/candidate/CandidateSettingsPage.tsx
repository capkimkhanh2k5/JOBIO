import { useSearchParams } from 'react-router-dom';
import { User, ShieldCheck } from 'lucide-react';
import { SettingsLayout, SettingsTab } from '@/components/shared/settings/SettingsLayout';
import { AccountSettings } from '@/components/shared/settings/AccountSettings';
import { SecuritySettings } from '@/components/shared/settings/SecuritySettings';

const CANDIDATE_TABS: SettingsTab[] = [
    { id: 'account', label: 'Tài khoản', icon: User },
    { id: 'security', label: 'Bảo mật', icon: ShieldCheck },
    // Notification tab omitted until BE supports it for candidates
];

export function CandidateSettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'account';

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
    };

    return (
        <SettingsLayout
            title="Cài đặt tài khoản"
            description="Quản lý thông tin định danh và tài khoản bảo mật của bạn."
            tabs={CANDIDATE_TABS}
            activeTab={activeTab}
            onTabChange={handleTabChange}
        >
            {activeTab === 'account' && <AccountSettings />}
            {activeTab === 'security' && <SecuritySettings />}
        </SettingsLayout>
    );
}

export default CandidateSettingsPage;
