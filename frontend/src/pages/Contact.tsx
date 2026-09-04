import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    Mail, Phone, MapPin, Clock, Send, Facebook, Linkedin,
    Twitter, Youtube, CheckCircle2, Loader2, Headphones
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import api from '@/services/api';

/* ─── Schema ─── */
const contactSchema = z.object({
    name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
    email: z.string().email('Email không hợp lệ'),
    phone: z.string().regex(/^(\+84|0)[0-9]{9}$/, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
    subject: z.string().min(5, 'Tiêu đề tối thiểu 5 ký tự'),
    message: z.string().min(20, 'Nội dung tối thiểu 20 ký tự'),
});
type ContactForm = z.infer<typeof contactSchema>;

/* ─── Fade-in ─── */
function FadeIn({ children, delay: d = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: d, ease: [0.22, 1, 0.36, 1] }} className={className}>
            {children}
        </motion.div>
    );
}

/* ─── Mock submit ─── */
const sendContact = (data: ContactForm) =>
    api.post('/api/contact/', data).then(r => r.data);

/* ─── Contact info ─── */
const INFO_CARDS = [
    {
        icon: Mail, title: 'Email', lines: ['support@jobio.vn', 'hr@jobio.vn'],
        iconColor: 'text-primary', bgColor: 'bg-primary/8',
    },
    {
        icon: Phone, title: 'Điện thoại', lines: ['(012) 3456 7890', '1800 456 789 (miễn phí)'],
        iconColor: 'text-teal-600', bgColor: 'bg-teal-50',
    },
    {
        icon: MapPin, title: 'Địa chỉ', lines: ['Đại Học Bách Khoa Đà Nẵng', '54 Nguyễn Lương Bằng, Phường Liên Chiểu, TP.Đà Nẵng'],
        iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50',
    },
    {
        icon: Clock, title: 'Giờ làm việc', lines: ['Thứ 2 – Thứ 6: 8:00 – 18:00', 'Thứ 7: 8:00 – 12:00'],
        iconColor: 'text-amber-600', bgColor: 'bg-amber-50',
    },
];

const SOCIALS = [
    { icon: Facebook, label: 'Facebook', href: '#', color: 'hover:text-primary hover:bg-primary/8 hover:border-primary/20 text-muted-foreground' },
    { icon: Linkedin, label: 'LinkedIn', href: '#', color: 'hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 text-muted-foreground' },
    { icon: Twitter, label: 'Twitter / X', href: '#', color: 'hover:text-foreground hover:bg-muted hover:border-border text-muted-foreground' },
    { icon: Youtube, label: 'YouTube', href: '#', color: 'hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-muted-foreground' },
];

const SUBJECTS = [
    'Hỗ trợ kỹ thuật', 'Báo cáo lỗi', 'Hợp tác doanh nghiệp',
    'Báo giá & Gói dịch vụ', 'Khiếu nại', 'Ý kiến đóng góp', 'Khác',
];

/* ─── Component ─── */
export default function Contact() {
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactForm>({
        resolver: zodResolver(contactSchema),
    });

    const mutation = useMutation({
        mutationFn: sendContact,
        onSuccess: () => {
            toast.success('Gửi thành công! Chúng tôi sẽ phản hồi trong vòng 24h.', {
                icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
            });
            reset();
        },
        onError: (err: Error) => toast.error(err.message),
    });

    const onSubmit = (data: ContactForm) => mutation.mutate(data);

    return (
        <div className="relative min-h-screen">
            {/* ── Hero ── */}
            <section className="relative pt-28 pb-12 px-4 text-center overflow-hidden">
                <FadeIn>
                    <Badge className="mb-4 bg-primary/8 border-primary/12 text-primary hover:bg-primary/12 px-4 py-1.5">
                        <Mail className="w-3.5 h-3.5 mr-1.5 inline" />
                        Liên hệ
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
                        Chúng tôi luôn sẵn sàng{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                            lắng nghe
                        </span>
                    </h1>
                </FadeIn>
                <FadeIn delay={0.15}>
                    <p className="text-muted-foreground max-w-xl mx-auto">
                        Có câu hỏi hoặc cần hỗ trợ? Đội ngũ JOBIO sẽ phản hồi trong vòng 1 ngày làm việc.
                    </p>
                </FadeIn>
                <div className="absolute top-20 left-1/3 w-56 h-56 bg-primary/80/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-1/3 w-44 h-44 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* ── Info Cards ── */}
            <section className="py-8 px-4">
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {INFO_CARDS.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <FadeIn key={card.title} delay={i * 0.07}>
                                <div className={cn(
                                    'bg-card rounded-2xl p-6 border border-border shadow-sm h-full hover:shadow-md transition-shadow'
                                )}>
                                    <div className={cn('p-2.5 rounded-xl w-fit mb-4', card.bgColor)}>
                                        <Icon className={cn('w-6 h-6', card.iconColor)} />
                                    </div>
                                    <h3 className="font-bold text-foreground mb-2">{card.title}</h3>
                                    {card.lines.map((line) => (
                                        <p key={line} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
                                    ))}
                                </div>
                            </FadeIn>
                        );
                    })}
                </div>
            </section>

            {/* ── Form + Map ── */}
            <section className="py-10 px-4">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <FadeIn>
                        <div className="bg-card rounded-3xl p-8 border border-border shadow-sm">
                            <h2 className="text-2xl font-bold text-foreground mb-6">Gửi tin nhắn</h2>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Name + Email */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                                            Họ và tên <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            {...register('name')}
                                            placeholder="Nguyễn Văn A"
                                            className={cn(
                                                'w-full px-4 py-2.5 rounded-xl text-sm bg-card border transition-all outline-none',
                                                'placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80',
                                                errors.name ? 'border-rose-500 ring-rose-500/20' : 'border-border'
                                            )}
                                        />
                                        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                                            Email <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            {...register('email')}
                                            placeholder="you@example.com"
                                            className={cn(
                                                'w-full px-4 py-2.5 rounded-xl text-sm bg-card border transition-all outline-none',
                                                'placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80',
                                                errors.email ? 'border-rose-500 ring-rose-500/20' : 'border-border'
                                            )}
                                        />
                                        {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">Số điện thoại</label>
                                    <input
                                        {...register('phone')}
                                        placeholder="0901 234 567"
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-xl text-sm bg-card border transition-all outline-none',
                                            'placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80',
                                            errors.phone ? 'border-rose-500 ring-rose-500/20' : 'border-border'
                                        )}
                                    />
                                    <p className="text-[11px] text-muted-foreground mt-1.5 mb-1 text-right">(Tùy chọn)</p>
                                    {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                                        Tiêu đề <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        {...register('subject')}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-xl text-sm bg-card border transition-all outline-none cursor-pointer text-foreground/80',
                                            'focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80',
                                            errors.subject ? 'border-rose-500 ring-rose-500/20' : 'border-border'
                                        )}
                                    >
                                        <option value="">Chọn chủ đề...</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject.message}</p>}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="text-xs font-semibold text-foreground/80 mb-1.5 block">
                                        Nội dung <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('message')}
                                        rows={5}
                                        placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-xl text-sm bg-card border transition-all outline-none resize-none',
                                            'placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/80/20 focus:border-primary/80',
                                            errors.message ? 'border-rose-500 ring-rose-500/20' : 'border-border'
                                        )}
                                    />
                                    {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message.message}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={mutation.isPending}
                                    className="w-full bg-primary text-white hover:bg-primary/90 border-0 shadow-sm font-semibold transition-all"
                                >
                                    {mutation.isPending ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
                                    ) : (
                                        <><Send className="w-4 h-4 mr-2" />Gửi tin nhắn</>
                                    )}
                                </Button>
                            </form>

                            {/* Social links */}
                            <div className="mt-8 pt-6 border-t border-border/60">
                                <p className="text-xs font-medium text-muted-foreground mb-4 text-center">Hoặc liên hệ qua mạng xã hội</p>
                                <div className="flex gap-3 justify-center">
                                    {SOCIALS.map(s => {
                                        const Icon = s.icon;
                                        return (
                                            <motion.a key={s.label} href={s.href} aria-label={s.label}
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                className={cn('p-2.5 rounded-xl bg-muted border border-border transition-colors', s.color)}>
                                                <Icon className="w-5 h-5" />
                                            </motion.a>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Map + Hours */}
                    <div className="space-y-6">
                        <FadeIn delay={0.1}>
                            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                                <div className="h-72 bg-muted relative">
                                    <iframe
                                        title="JOBIO Office Location"
                                        src="https://www.google.com/maps?q=%C4%90%E1%BA%A1i%20H%E1%BB%8Dc%20B%C3%A1ch%20Khoa%20%C4%90%C3%A0%20N%E1%BA%B5ng%2C%2054%20Nguy%E1%BB%85n%20L%C6%B0%C6%A1ng%20B%E1%BA%B1ng%2C%20Li%C3%AAn%20Chi%E1%BB%83u%2C%20%C4%90%C3%A0%20N%E1%BA%B5ng&output=embed"
                                        className="w-full h-full transition-opacity"
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/8 rounded-lg shrink-0">
                                            <MapPin className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">JOBIO Headquarters</p>
                                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                                Đại Học Bách Khoa Đà Nẵng<br />
                                                54 Nguyễn Lương Bằng, Phường Liên Chiểu, TP.Đà Nẵng
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Business hours */}
                        <FadeIn delay={0.15}>
                            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-foreground">Giờ làm việc</h3>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { day: 'Thứ 2 – Thứ 6', hours: '08:00 – 18:00', open: true },
                                        { day: 'Thứ 7', hours: '08:00 – 12:00', open: true },
                                        { day: 'Chủ nhật', hours: 'Đóng cửa', open: false },
                                    ].map(item => (
                                        <div key={item.day} className="flex items-center justify-between py-2 border-b border-border/60 last:border-0 last:pb-0">
                                            <span className="text-sm font-medium text-foreground/80">{item.day}</span>
                                            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full text-center min-w-[100px]',
                                                item.open ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                            )}>
                                                {item.hours}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 rounded-xl bg-primary/8 border border-primary/12 flex items-start gap-3">
                                    <Headphones className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-foreground mb-1">Hotline hỗ trợ 24/7</p>
                                        <p className="text-sm text-muted-foreground">
                                            <strong className="text-primary text-lg mr-1">1800 567 789</strong><br />
                                            (Miễn phí cước, dành cho sự cố khẩn cấp)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>
        </div>
    );
}
