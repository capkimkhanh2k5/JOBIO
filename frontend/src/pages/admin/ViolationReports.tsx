import { motion } from 'framer-motion';
import { AlertTriangle, Shield, CheckCircle, Clock } from 'lucide-react';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
});

export default function ViolationReports() {
    return (
        <div className="p-6 lg:p-8 space-y-8 w-full">
            <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        Báo cáo Vi phạm
                    </h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Xử lý các khiếu nại và vi phạm từ cộng đồng người dùng.</p>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Chờ xử lý', value: '12', color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
                    { label: 'Đã giải quyết', value: '148', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
                    { label: 'Nghiêm trọng', value: '3', color: 'text-red-600', bg: 'bg-red-50', icon: Shield },
                ].map((stat, i) => (
                    <motion.div key={stat.label} {...fadeUp(0.1 + i * 0.05)} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Reports List */}
            <motion.div {...fadeUp(0.3)} className="space-y-4">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-6 hover:border-red-200 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-50 text-red-600 uppercase border border-red-100">Lừa đảo / Spam</span>
                                <span className="text-xs text-slate-400 font-medium">2 giờ trước</span>
                            </div>
                            <h4 className="font-bold text-slate-900 mb-1">Tin tuyển dụng: "Tuyển CTV nhập liệu lương 500k/ngày"</h4>
                            <p className="text-sm text-slate-500 mb-4">Người báo cáo: <strong>Nguyễn Văn A</strong>. Nội dung: "Yêu cầu đặt cọc tiền đồng phục trước khi nhận việc, có dấu hiệu lừa đảo."</p>
                            <div className="flex items-center gap-3">
                                <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors">Gỡ tin ngay</button>
                                <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Bỏ qua</button>
                                <button className="px-3 py-1.5 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors">Liên hệ nhà tuyển dụng</button>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
