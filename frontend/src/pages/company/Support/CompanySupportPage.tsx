import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LifeBuoy, Mail, MessageSquare, Phone, MapPin,
    Send, CheckCircle2, HelpCircle,
    Clock, ExternalLink, ChevronDown
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
        answer: "Để tin tuyển dụng thu hút ứng viên, bạn nên cung cấp đầy đủ thông tin về mức lương, mô tả công việc chi tiết và các phúc lợi hấp dẫn."
    },
    {
        question: "Tại sao tin đăng của tôi đang ở trạng thái 'Chờ duyệt'?",
        answer: "Mọi tin đăng mới đều được đội ngũ kiểm duyệt xem xét trong vòng 2-4 giờ làm việc để đảm bảo tính xác thực nội dung."
    },
    {
        question: "Làm cách nào để thay đổi thông tin công ty?",
        answer: "Bạn có thể vào mục 'Hồ sơ công ty' trong thanh điều hướng bên trái để cập nhật logo, mô tả và quy mô doanh nghiệp."
    },
    {
        question: "Tôi có thể xuất dữ liệu ứng viên ra file Excel không?",
        answer: "Có, JOBIO hỗ trợ xuất danh sách ứng viên. Bạn có thể bấm nút 'Xuất báo cáo' trong trang Quản lý ứng viên."
    },
    {
        question: "Làm sao để gia hạn gói dịch vụ đang sử dụng?",
        answer: "Bạn truy cập vào mục 'Gói dịch vụ', hệ thống sẽ hiển thị các lựa chọn gia hạn hoặc nâng cấp phù hợp."
    }
];

const OFFICE_NAME = 'Văn phòng JOBIO';
const OFFICE_ADDRESS = '54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng, Việt Nam';
const MAP_EMBED_URL = 'https://maps.google.com/maps?q=54%20Nguy%E1%BB%85n%20L%C6%B0%C6%A1ng%20B%E1%BA%B1ng,%20Li%C3%AAn%20Chi%E1%BB%83u,%20%C4%90%C3%A0%20N%E1%BA%B5ng&t=&z=15&ie=UTF8&iwloc=&output=embed';
const OFFICE_MAP_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${OFFICE_NAME}, ${OFFICE_ADDRESS}`)}`;

function FaqItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className={cn(
            "border-b border-border/60 last:border-0 transition-all",
            isOpen ? "bg-muted/40" : "bg-transparent"
        )}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-3.5 px-1 text-left group outline-none cursor-pointer"
            >
                <span className={cn(
                    "font-bold text-xs sm:text-sm transition-colors",
                    isOpen ? "text-primary" : "text-foreground/90 group-hover:text-primary"
                )}>
                    {question}
                </span>
                <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ml-2",
                    isOpen ? "bg-primary/12 text-primary rotate-180" : "bg-muted text-muted-foreground/60 group-hover:bg-primary/8 group-hover:text-primary"
                )}>
                    <ChevronDown className="w-3.5 h-3.5" />
                </div>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="overflow-hidden"
                    >
                        <p className="pb-3.5 px-1 text-muted-foreground font-medium leading-relaxed text-xs sm:text-sm">
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
        <div className="w-full mx-auto min-h-screen">
            <div>
                <PageHeader
                    title="Hỗ trợ & Giải đáp"
                    description="Giải đáp thắc mắc và tiếp nhận yêu cầu hỗ trợ từ doanh nghiệp."
                    icon={LifeBuoy}
                    action={
                        <Badge className="bg-primary/8 text-primary border-primary/20 px-3 py-1 rounded-lg font-bold shadow-none text-xs">
                            Trực tuyến 24/7
                        </Badge>
                    }
                />
            </div>

            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-4 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                    {/* ── Left Column: Form & FAQs ───────────────────────────── */}
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden"
                        >
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-5 border-b border-border/60 pb-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-foreground tracking-tight">Gửi yêu cầu hỗ trợ</h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">Thời gian phản hồi dự kiến: dưới 2 giờ</p>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-xs font-bold text-foreground/80">
                                                Email nhận phản hồi
                                            </Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    className="pl-10 h-10 rounded-xl border-border text-xs font-medium"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="subject" className="text-xs font-bold text-foreground/80">
                                                Chủ đề hỗ trợ
                                            </Label>
                                            <Input
                                                id="subject"
                                                placeholder="VD: Đăng tin, Thanh toán, Tài khoản..."
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                className="h-10 rounded-xl border-border text-xs font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="message" className="text-xs font-bold text-foreground/80">
                                            Nội dung yêu cầu
                                        </Label>
                                        <Textarea
                                            id="message"
                                            placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            className="min-h-[110px] rounded-xl border-border text-xs font-medium p-3.5 resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>Thông tin bảo mật theo chuẩn ISO 27001</span>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            size="default"
                                            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-primary text-white rounded-xl px-6 h-10 font-bold shadow-md transition-all gap-2 cursor-pointer text-xs"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Đang gửi...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5">
                                                    Gửi yêu cầu <Send className="w-3.5 h-3.5 ml-0.5" />
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>

                        {/* FAQs Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-card rounded-2xl border border-border/80 shadow-sm p-5 space-y-3"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                    <HelpCircle className="w-4 h-4" />
                                </div>
                                <h3 className="text-base font-extrabold text-foreground tracking-tight">Câu hỏi thường gặp</h3>
                            </div>
                            <div className="divide-y divide-border/60">
                                {faqs.map((faq, idx) => (
                                    <FaqItem key={idx} question={faq.question} answer={faq.answer} />
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ── Right Column: Contact Cards & Light Google Map ────── */}
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="bg-card rounded-2xl border border-border/80 shadow-sm p-5 space-y-5"
                        >
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Thông tin liên hệ</h3>

                            <div className="space-y-3">
                                {[
                                    { icon: <Phone className="w-4 h-4" />, label: 'Hotline tuyển dụng', value: '0123 456 789', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
                                    { icon: <Mail className="w-4 h-4" />, label: 'Email hỗ trợ', value: 'support@jobio.vn', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-all border border-border/40">
                                        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0 shadow-sm`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                                            <p className="text-xs sm:text-sm font-extrabold text-foreground">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-border/60 space-y-3">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Thời gian phục vụ</h4>
                                <div className="space-y-2">
                                    {[
                                        { day: 'Thứ 2 - Thứ 6', time: '08:00 - 21:00' },
                                        { day: 'Thứ 7 & Chủ nhật', time: '08:30 - 17:30' }
                                    ].map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-primary/70" /> {t.day}
                                            </span>
                                            <span className="text-foreground font-bold">{t.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Office Location Card — Light Style with Google Maps Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.3 }}
                            className="bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden"
                        >
                            {/* Interactive Google Maps iframe */}
                            <div className="w-full h-44 bg-muted relative border-b border-border/60">
                                <iframe
                                    title="JOBIO Office Location"
                                    src={MAP_EMBED_URL}
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    allowFullScreen
                                />
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-extrabold text-foreground">{OFFICE_NAME}</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-snug">{OFFICE_ADDRESS}</p>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    variant="outline"
                                    className="w-full bg-card hover:bg-muted text-primary border-primary/20 hover:border-primary/40 rounded-xl h-9 text-xs font-bold gap-1.5 transition-all cursor-pointer"
                                >
                                    <a href={OFFICE_MAP_URL} target="_blank" rel="noopener noreferrer">
                                        Xem trên Google Maps <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                    </a>
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.4 }}
                            className="p-4 rounded-2xl bg-primary/8 border border-primary/15 text-center"
                        >
                            <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-0.5">Cần hỗ trợ kỹ thuật?</p>
                            <p className="text-xs font-extrabold text-foreground">tech-support@jobio.vn</p>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
}
