import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';

export interface SettingsTab {
    id: string;
    label: string;
    icon: React.ElementType;
}

interface SettingsLayoutProps {
    title?: string;
    description?: string;
    tabs: SettingsTab[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    children: ReactNode;
}

export function SettingsLayout({ title, description, tabs, activeTab, onTabChange, children }: SettingsLayoutProps) {
    return (
        <div className="relative flex flex-col w-full h-full min-h-0">
            {/* Page header — identical to every other dashboard page */}
            {(title || description) && (
                <div className="sticky top-0 z-20">
                    <PageHeader
                        title={title ?? ''}
                        description={description}
                        icon={Settings}
                    />
                </div>
            )}

            <div className="p-6 lg:p-8 relative z-10 w-full flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Tabs */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-1 flex flex-col gap-1"
                    >
                        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange(tab.id)}
                                        className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
                                            isActive
                                                ? 'bg-violet-50 text-violet-700 border border-violet-100'
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="md:col-span-3"
                    >
                        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden min-h-[500px]">
                            {children}
                        </Card>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default SettingsLayout;
