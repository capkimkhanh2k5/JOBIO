import { motion } from 'framer-motion';
import { Briefcase, Zap, Building, BarChart3, Users, Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

/* Dữ liệu các giải pháp */
const SOLUTIONS = [
    {
        id: 1,
        title: "Tuyển dụng AI (AI Recruiting)",
        description: "Hệ thống AI tự động phân tích hàng nghìn CV để tìm ra ứng viên phù hợp nhất dựa trên tỷ lệ khớp kỹ năng và kinh nghiệm.",
        icon: Zap,
        color: "text-amber-500",
        bg: "bg-amber-50"
    },
    {
        id: 2,
        title: "Quản lý dữ liệu tập trung",
        description: "Lưu trữ toàn bộ hồ sơ ứng viên, lịch sử tuyển dụng và các báo cáo phân tích trên một nền tảng an toàn, dễ tra cứu.",
        icon: Database,
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    },
    {
        id: 3,
        title: "Công cụ đánh giá đa chiều",
        description: "Hệ thống cung cấp các bài kiểm tra chuyên môn và đánh giá hành vi trước khi phỏng vấn, đảm bảo sự chọn lọc kỹ lưỡng.",
        icon: BarChart3,
        color: "text-emerald-500",
        bg: "bg-emerald-50"
    },
    {
        id: 4,
        title: "Tự động hóa luồng làm việc",
        description: "Tự động gửi email hẹn phỏng vấn, từ chối ứng viên và thiết lập lịch làm việc giúp tiết kiệm đến 60% thời gian của HR.",
        icon: Network,
        color: "text-cyan-500",
        bg: "bg-cyan-50"
    }
];

// Định nghĩa Database Component cho Icon
function Database(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>
}

export default function HRSolutions() {
    return (
        <div className="relative min-h-screen bg-gray-50/50">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden bg-white">
                <div className="max-w-7xl mx-auto z-10 relative flex flex-col lg:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex-1 space-y-8"
                    >
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100 px-4 py-1.5 font-bold uppercase tracking-wider text-xs">
                            <Briefcase className="w-4 h-4 mr-2 inline" />
                            Giải pháp toàn diện
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.15]">
                            Cách mạng hóa quy trình <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">Quản trị nhân sự</span>
                        </h1>
                        <p className="text-gray-500 text-lg sm:text-xl max-w-xl leading-relaxed">
                            Công nghệ AI giúp doanh nghiệp chuyển đổi số, tối ưu hóa tuyển dụng, dự báo nguồn lực và tiết kiệm hàng tỷ đồng chi phí vận hành.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild size="lg" className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 shadow-xl shadow-indigo-500/20">
                                <Link to="/auth?mode=register">Dùng thử miễn phí</Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="h-14 rounded-2xl border-gray-200 hover:bg-gray-50 text-gray-600 font-bold px-8">
                                <Link to="/contact">Đặt lịch tư vấn</Link>
                            </Button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex-1 relative w-full"
                    >
                        {/* Abstract visualizer map / Dashboard UI */}
                        <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-2xl relative flex flex-col p-6">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50 to-white/5 opacity-50 pointer-events-none" />
                            {/* Header */}
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                                <div className="w-32 h-4 bg-gray-100 rounded-full" />
                                <div className="flex gap-2">
                                    <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                                    </div>
                                </div>
                            </div>
                            {/* Charts simulation */}
                            <div className="flex gap-6 h-32 mb-6">
                                <div className="flex-1 bg-gradient-to-t from-indigo-100 to-white rounded-xl border border-indigo-50 relative overflow-hidden group">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 group-hover:h-full opacity-10 transition-all duration-500" />
                                </div>
                                <div className="flex-1 bg-gradient-to-t from-cyan-100 to-white rounded-xl border border-cyan-50 relative overflow-hidden group">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-cyan-500 group-hover:h-full opacity-10 transition-all duration-500" />
                                </div>
                                <div className="flex-1 bg-gradient-to-t from-amber-100 to-white rounded-xl border border-amber-50 relative overflow-hidden group">
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-500 group-hover:h-full opacity-10 transition-all duration-500" />
                                </div>
                            </div>
                            {/* List simulation */}
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-12 bg-gray-50 rounded-xl flex items-center px-4 gap-4">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                        <div className="w-1/3 h-2.5 bg-gray-200 rounded-full" />
                                        <div className="w-1/4 h-2.5 bg-gray-200 rounded-full ml-auto" />
                                    </div>
                                ))}
                            </div>
                            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none" />
                        </div>
                    </motion.div>
                </div>

                {/* Background Shapes */}
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
            </section>

            {/* Features Section */}
            <section className="py-24 max-w-7xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Tại sao hơn 2.000+ doanh nghiệp chọn JOBIO?
                    </h2>
                    <p className="text-gray-500 max-w-2xl mx-auto text-lg">
                        Bộ giải pháp đóng gói toàn diện đáp ứng mọi quy mô doanh nghiệp từ Startup tới Tập đoàn đa quốc gia.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {SOLUTIONS.map((item, idx) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-3xl p-8 border border-gray-100 hover:border-indigo-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group"
                        >
                            <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-lg">{item.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-indigo-900 py-24 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-800/50 to-indigo-950/80 pointer-events-none" />
                <div className="max-w-3xl mx-auto relative z-10">
                    <Building className="w-16 h-16 text-indigo-400 mx-auto mb-6" />
                    <h2 className="text-4xl font-black text-white mb-6">Bạn đã sẵn sàng nâng cấp phòng Phỏng vấn & Tuyển dụng?</h2>
                    <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
                        Đội ngũ kinh doanh của JOBIO luôn sẵn sàng thiết kế lộ trình chuyển đổi và cung cấp giải pháp HR phù hợp nhất cho doanh nghiệp bạn.
                    </p>
                    <Button asChild size="lg" className="h-14 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold px-10 shadow-2xl">
                        <Link to="/contact">Nhận tư vấn ngay</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
