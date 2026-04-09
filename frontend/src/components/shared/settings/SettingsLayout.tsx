import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

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
        <div className="relative flex flex-col w-full h-full min-h-0 bg-transparent">
            {/* Page header style consistency */}
            {(title || description) && (
                <div className="bg-white/40 backdrop-blur-xl border-b border-white/20 px-6 lg:px-8 py-5 md:py-6 shrink-0">
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                        {title && (
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                {title}
                            </h1>
                        )}
                        {description && <p className="text-sm text-slate-500 font-medium mt-1">{description}</p>}
                    </motion.div>
                </div>
            )}

            <div className="p-6 lg:p-8 relative z-10 w-full flex-1 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Sidebar Tabs */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="md:col-span-1 flex flex-col gap-2"
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm ${isActive
                                            ? 'bg-white shadow-sm text-violet-600 border border-slate-200'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
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
