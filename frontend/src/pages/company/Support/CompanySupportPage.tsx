import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LifeBuoy, Mail, MessageSquare, Phone, MapPin,
    Send, CheckCircle2, HelpCircle,
    Clock, ArrowRight, ChevronDown
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import api from '@/services/api';

const faqs = [
    {
        question: "Làm thế nào để đăng tin tuyển dụng hiệu quả hơn?",
        answer: "Để tin tuyển dụng thu hút ứng viên, bạn nên cung cấp đầy đủ thông tin về mức lương, mô tả công việc chi tiết và các phúc lợi hấp dẫn. Ngoài ra, việc sử dụng các từ khóa chuyên ngành trong tiêu đề cũng giúp tin của bạn dễ được tìm thấy hơn."
    },
    {
        question: "Tại sao tin đăng của tôi đang ở trạng thái 'Chờ duyệt'?",
        answer: "Mọi tin đăng mới đều được đội ngũ kiểm duyệt của JOBIO xem xét trong vòng 2-4 giờ làm việc để đảm bảo tính xác thực và chất lượng nội dung trước khi hiển thị công khai."
    },
    {
        question: "Làm cách nào để thay đổi thông tin công ty?",
        answer: "Bạn có thể vào mục 'Hồ sơ công ty' trong thanh điều hướng bên trái để cập nhật logo, mô tả, quy mô và các thông tin liên quan khác của doanh nghiệp."
    },
    {
        question: "Tôi có thể xuất dữ liệu ứng viên ra file Excel không?",
        answer: "Có, JOBIO hỗ trợ xuất danh sách ứng viên chuyên sâu. Bạn có thể tìm thấy nút 'Xuất báo cáo' trong trang Chi tiết tin tuyển dụng hoặc trang Quản lý ứng viên."
    },
    {
        question: "Làm sao để gia hạn gói dịch vụ đang sử dụng?",
        answer: "Bạn hãy truy cập vào mục 'Gói dịch vụ', hệ thống sẽ hiển thị các lựa chọn gia hạn hoặc nâng cấp phù hợp với nhu cầu hiện tại của bạn."
    }
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={cn(
            "border-b border-slate-100 last:border-0 transition-all",
            isOpen ? "bg-slate-50/50" : "bg-transparent"
        )}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-5 text-left group outline-none"
            >
                <span className={cn(
                    "font-bold text-sm md:text-base transition-colors",
                    isOpen ? "text-violet-600" : "text-slate-700 group-hover:text-violet-600"
                )}>
                    {question}
                </span>
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isOpen ? "bg-violet-100 text-violet-600 rotate-180 shadow-sm" : "bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600"
                )}>
                    <ChevronDown className="w-4 h-4" />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <p className="pb-6 text-slate-500 font-medium leading-relaxed pr-8 text-sm md:text-base">
                            {answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function CompanySupportPage() {
    const user = useUserStore(state => state.user);
    const [email, setEmail] = useState(user?.email || '');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message) {
            toast.error('Vui lòng nhập nội dung yêu cầu hỗ trợ');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/api/contact/', {
                name: (user as any)?.full_name || user?.email || 'Khách hàng Doanh nghiệp',
                email: email,
                subject: subject || 'Yêu cầu hỗ trợ (Doanh nghiệp)',
                message: message
            });

            toast.success('Yêu cầu đã được gửi đi!', {
                description: 'Chúng tôi sẽ phản hồi lại bạn qua email sớm nhất có thể.',
            });

            setMessage('');
            setSubject('');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-[-20%] w-[60%] h-[500px] bg-gradient-to-l from-violet-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>

            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Hỗ trợ & Giải đáp"
                    description="Chúng tôi luôn sẵn sàng hỗ trợ bạn giải quyết mọi vấn đề trong quá trình sử dụng hệ thống."
                    icon={LifeBuoy}
                    action={
                        <Badge className="bg-white/80 text-violet-600 border-violet-100 px-4 py-2 rounded-xl font-bold shadow-sm backdrop-blur-sm">
                            Trực tuyến 24/7
                        </Badge>
                    }
                />
            </div>

            <div className="w-full mx-auto space-y-8 relative z-10 p-6 lg:p-8 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                    {/* ── Left Column: Contact Form ───────────────────────────── */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm overflow-hidden"
                        >
                            <div className="p-8 md:p-10">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <MessageSquare className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gửi yêu cầu hỗ trợ</h2>
                                        <p className="text-slate-500 font-semibold mt-0.5">Thời gian phản hồi dự kiến: dưới 2 giờ</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
                                                Email của bạn
                                            </Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pl-12 h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <Label htmlFor="subject" className="text-sm font-bold text-slate-700 ml-1">
                                                Chủ đề quan tâm
                                            </Label>
                                            <Input
                                                id="subject"
                                                placeholder="VD: Tài khoản, Đăng tin, Thanh toán..."
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="h-14 rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all font-bold text-slate-900 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label htmlFor="message" className="text-sm font-bold text-slate-700 ml-1">
                                            Nội dung cần giải đáp
                                        </Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="min-h-[200px] rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/20 transition-all font-bold text-slate-900 p-5 resize-none placeholder:text-slate-400"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
                                        <div className="flex items-center gap-2.5 text-slate-400 text-sm font-bold">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            </div>
                                            Thông tin được bảo mật mã hóa đầu cuối
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl px-12 h-14 font-black shadow-xl shadow-violet-600/25 transition-all gap-3 group relative overflow-hidden text-base shrink-0"
                                        >
                                            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                                            {isSubmitting ? (
                                                <div className="relative flex items-center gap-2">
                                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Đang xử lý...
                                                </div>
                                            ) : (
                                                <div className="relative flex items-center gap-2">
                                                    Gửi yêu cầu <Send className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>

                        {/* FAQs Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="space-y-5"
                        >
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <HelpCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Câu hỏi thường gặp</h3>
                            </div>
                            <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm px-8 divide-y divide-slate-100">
                                {faqs.map((faq, idx) => (
                                    <FaqItem key={idx} question={faq.question} answer={faq.answer} />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right Column: Contact Cards ──────────────────────────── */}
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-sm p-8 space-y-8"
                        >
                            <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.2em] px-1">Thông tin liên hệ</h3>

                            <div className="space-y-5">
                                {[
                                    { icon: <Phone className="w-6 h-6" />, label: 'Hotline tuyển dụng', value: '1800 599 984', color: 'text-emerald-600 bg-emerald-50' },
                                    { icon: <Mail className="w-6 h-6" />, label: 'Email hỗ trợ', value: 'support@jobio.vn', color: 'text-violet-600 bg-violet-50' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group">
                                        <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-[15px] font-black text-slate-900">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-5 px-1">Thời gian phục vụ</h4>
                                <div className="space-y-4">
                                    {[
                                        { day: 'Thứ 2 - Thứ 6', time: '08:00 - 21:00', icon: <Clock className="w-4 h-4" /> },
                                        { day: 'Thứ 7 & Chủ nhật', time: '08:30 - 17:30', icon: <Clock className="w-4 h-4" /> }
                                    ].map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-sm font-bold">
                                            <span className="text-slate-500 flex items-center gap-2.5">
                                                {t.icon} {t.day}
                                            </span>
                                            <span className="text-slate-900">{t.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Office location card */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white overflow-hidden relative group shadow-2xl shadow-slate-900/20"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 transition-transform group-hover:scale-125 group-hover:rotate-12 pointer-events-none duration-700">
                                <MapPin className="w-32 h-32" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-lg">
                                        <MapPin className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <h4 className="text-xl font-black tracking-tight">Văn phòng JOBIO</h4>
                                </div>
                                <p className="text-slate-300 text-sm font-bold leading-relaxed opacity-90 mb-8">
                                    Tầng 15, Keangnam Landmark 72, Đường Phạm Hùng, Quận Nam Từ Liêm, Hà Nội.
                                </p>
                                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-2xl h-14 font-black gap-2 transition-all shadow-lg shadow-violet-600/30">
                                    Xem Google Maps <ArrowRight className="w-5 h-5" />
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="p-6 rounded-3xl bg-violet-50 border border-violet-100/50 text-center"
                        >
                            <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">Cần hỗ trợ kỹ thuật?</p>
                            <p className="text-sm font-bold text-violet-900">tech-support@jobio.vn</p>
                        </motion.div>
                    </div>

                </div>

                {/* Standardized Footer */}
                <footer className="max-w-6xl mx-auto px-8 pt-10 pb-20 text-center">
                    <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống an toàn bảo mật chuẩn ISO 27001</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em]">
                        &copy; 2026 JOBIO Technology Platform
                    </p>
                </footer>
            </div>
        </div>
    );
}
