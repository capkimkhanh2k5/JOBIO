import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical } from 'lucide-react';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 }
});

export default function JobMarketplace() {
    return (
        <div className="p-6 lg:p-8 space-y-8 w-full">
            <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Thị trường Việc làm</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Giám sát và kiểm duyệt toàn bộ tin tuyển dụng trên hệ thống.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 border border-slate-200 bg-white text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        Bộ lọc
                    </button>
                </div>
            </motion.div>

            {/* Job Search & Quick Filters */}
            <motion.div {...fadeUp(0.1)} className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề tin, công ty, ID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 bg-white text-sm"
                    />
                </div>
            </motion.div>

            {/* Placeholder for Jobs Table */}
            <motion.div {...fadeUp(0.2)} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Tin tuyển dụng</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Công ty</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Ngày đăng</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {[1, 2, 3].map((i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 text-sm">Senior Frontend Engineer (React)</span>
                                            <span className="text-xs text-slate-500">ID: #JOB-882{i}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-600 text-sm">TechVibe Solutions</td>
                                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">18 Th04, 2026</td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase border border-emerald-100">
                                            Đang hiển thị
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-6 bg-slate-50/30 border-t border-slate-100 text-center">
                    <button className="text-sm font-bold text-violet-600 hover:underline">Xem tất cả tin đăng</button>
                </div>
            </motion.div>
        </div>
    );
}
