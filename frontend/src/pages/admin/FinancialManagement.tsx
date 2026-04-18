import { motion } from 'framer-motion';
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, CreditCard, DollarSign } from 'lucide-react';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
});

export default function FinancialManagement() {
    return (
        <div className="p-6 lg:p-8 space-y-8 w-full">
            <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Tài chính</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Theo dõi doanh thu, giao dịch và các gói dịch vụ.</p>
                </div>
                <button className="px-4 py-2 bg-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Xuất báo cáo
                </button>
            </motion.div>

            {/* Financial Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Tổng doanh thu', value: '1.280.000.000đ', change: '+12.5%', trend: 'up', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Giao dịch tháng này', value: '142', change: '+8.2%', trend: 'up', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Gói Pro active', value: '86', change: '-2.4%', trend: 'down', icon: Wallet, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Giá trị trung bình', value: '8.500.000đ', change: '+5.1%', trend: 'up', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
                ].map((stat, i) => (
                    <motion.div key={stat.label} {...fadeUp(0.1 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-bold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {stat.change}
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Placeholder for Transactions Table */}
            <motion.div {...fadeUp(0.3)} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Giao dịch gần đây</h3>
                    <button className="text-xs font-bold text-violet-600 hover:underline">Xem tất cả</button>
                </div>
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Đang tải dữ liệu giao dịch...</p>
                </div>
            </motion.div>
        </div>
    );
}
