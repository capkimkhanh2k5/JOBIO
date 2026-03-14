import { useSearchParams } from 'react-router-dom';
import { User, ShieldCheck, Settings } from 'lucide-react';
import { SettingsLayout, SettingsTab } from '@/components/shared/settings/SettingsLayout';
import { AccountSettings } from '@/components/shared/settings/AccountSettings';
import { SecuritySettings } from '@/components/shared/settings/SecuritySettings';
import { PageHeader } from '@/components/shared/PageHeader';

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
        <>
            <PageHeader
                title="Cài đặt tài khoản"
                description="Quản lý thông tin định danh và tài khoản bảo mật của bạn."
                icon={Settings}
            />
            
            <div className="p-6 lg:p-8 w-full flex-1">
                <SettingsLayout
                    tabs={CANDIDATE_TABS}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                >
                    {activeTab === 'account' && <AccountSettings />}
                    {activeTab === 'security' && <SecuritySettings />}
                </SettingsLayout>
            </div>
        </>
    );
}

export default CandidateSettingsPage;
