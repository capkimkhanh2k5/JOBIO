import { motion } from 'framer-motion';
import { BarChart, PieChart, Users, Zap, Target, Activity } from 'lucide-react';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
});

export default function AdvancedAnalytics() {
    return (
        <div className="p-6 lg:p-8 space-y-6 w-full flex-1">
            <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <PieChart className="w-6 h-6 text-violet-600" />
                        Phân tích Chuyên sâu
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Dữ liệu phân tích hành vi người dùng và hiệu quả nền tảng.</p>
                </div>
            </motion.div>

            {/* Performance Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recruitment Efficiency */}
                <motion.div {...fadeUp(0.1)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <Target className="w-32 h-32" />
                    </div>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-200">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Hiệu quả Kết nối</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">Tỷ lệ matching thành công giữa ứng viên và tin tuyển dụng đã tăng 18% so với quý trước.</p>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tỷ lệ Apply</p>
                                <p className="text-2xl font-black text-slate-900">42.5%</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Thời gian khớp</p>
                                <p className="text-2xl font-black text-slate-900">4.2 ngày</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* User Retention */}
                <motion.div {...fadeUp(0.2)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                        <Users className="w-32 h-32" />
                    </div>
                    <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-200">
                            <Activity className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Độ trung thành (Retention)</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">Tỷ lệ nhà tuyển dụng quay lại đăng tin đạt mức 72%, khẳng định giá trị bền vững của platform.</p>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active (30d)</p>
                                <p className="text-2xl font-black text-slate-900">8.4k</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Churn rate</p>
                                <p className="text-2xl font-black text-slate-900">2.1%</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Placeholder for Data Charts */}
            <motion.div {...fadeUp(0.3)} className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <BarChart className="w-10 h-10 text-slate-300" />
                </div>
                <h4 className="font-black text-slate-900 mb-2">Đang xử lý tập dữ liệu...</h4>
                <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">Hệ thống đang tổng hợp dữ liệu từ các ứng dụng Recruitment và Analytics để xuất báo cáo chi tiết.</p>
            </motion.div>
        </div>
    );
}
