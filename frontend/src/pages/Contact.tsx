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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
const sendContact = async (data: ContactForm) => {
    await delay(1500);
    if (data.email === 'error@error.com') throw new Error('Gửi thất bại, vui lòng thử lại.');
    return { success: true };
};

/* ─── Contact info ─── */
const INFO_CARDS = [
    {
        icon: Mail, title: 'Email', lines: ['support@jobio.vn', 'hr@jobio.vn'],
        iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50',
    },
    {
        icon: Phone, title: 'Điện thoại', lines: ['(028) 3822 1234', '1800 599 984 (miễn phí)'],
        iconColor: 'text-violet-600', bgColor: 'bg-violet-50',
    },
    {
        icon: MapPin, title: 'Địa chỉ', lines: ['Tầng 12, Tòa nhà Saigon Centre', '65 Lê Lợi, Quận 1, TP.HCM'],
        iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50',
    },
    {
        icon: Clock, title: 'Giờ làm việc', lines: ['Thứ 2 – Thứ 6: 8:00 – 18:00', 'Thứ 7: 8:00 – 12:00'],
        iconColor: 'text-amber-600', bgColor: 'bg-amber-50',
    },
];

const SOCIALS = [
    { icon: Facebook, label: 'Facebook', href: '#', color: 'hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 text-gray-500' },
    { icon: Linkedin, label: 'LinkedIn', href: '#', color: 'hover:text-sky-600 hover:bg-sky-50 hover:border-sky-200 text-gray-500' },
    { icon: Twitter, label: 'Twitter / X', href: '#', color: 'hover:text-gray-900 hover:bg-gray-100 hover:border-gray-300 text-gray-500' },
    { icon: Youtube, label: 'YouTube', href: '#', color: 'hover:text-red-600 hover:bg-red-50 hover:border-red-200 text-gray-500' },
];

const SUBJECTS = [
    'Hỗ trợ kỹ thuật', 'Báo cáo lỗi', 'Hợp tác doanh nghiệp',
    'Báo giá & Gói dịch vụ', 'Khiếu nại', 'Ý kiến đóng góp', 'Khác',
];

/* ─── Component ─── */
export default function Contact() {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>({
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
                    <Badge className="mb-4 bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100 px-4 py-1.5">
                        <Mail className="w-3.5 h-3.5 mr-1.5 inline" />
                        Liên hệ
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-gray-900">
                        Chúng tôi luôn sẵn sàng{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                            lắng nghe
                        </span>
                    </h1>
                </FadeIn>
                <FadeIn delay={0.15}>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Có câu hỏi hoặc cần hỗ trợ? Đội ngũ JOBIO sẽ phản hồi trong vòng 1 ngày làm việc.
                    </p>
                </FadeIn>
                <div className="absolute top-20 left-1/3 w-56 h-56 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-1/3 w-44 h-44 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* ── Info Cards ── */}
            <section className="py-8 px-4">
                <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {INFO_CARDS.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <FadeIn key={card.title} delay={i * 0.07}>
                                <div className={cn(
                                    'bg-white rounded-2xl p-6 border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow'
                                )}>
                                    <div className={cn('p-2.5 rounded-xl w-fit mb-4', card.bgColor)}>
                                        <Icon className={cn('w-6 h-6', card.iconColor)} />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">{card.title}</h3>
                                    {card.lines.map((line) => (
                                        <p key={line} className="text-sm text-gray-500 leading-relaxed">{line}</p>
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
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Gửi tin nhắn</h2>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Name + Email */}
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                                            Họ và tên <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            {...register('name')}
                                            placeholder="Nguyễn Văn A"
                                            className={cn(
                                                'w-full px-4 py-2.5 rounded-xl text-sm bg-white border transition-all outline-none',
                                                'placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                                errors.name ? 'border-rose-500 ring-rose-500/20' : 'border-gray-300'
                                            )}
                                        />
                                        {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                                            Email <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            {...register('email')}
                                            placeholder="you@example.com"
                                            className={cn(
                                                'w-full px-4 py-2.5 rounded-xl text-sm bg-white border transition-all outline-none',
                                                'placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                                errors.email ? 'border-rose-500 ring-rose-500/20' : 'border-gray-300'
                                            )}
                                        />
                                        {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Số điện thoại</label>
                                    <input
                                        {...register('phone')}
                                        placeholder="0901 234 567"
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-xl text-sm bg-white border transition-all outline-none',
                                            'placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                            errors.phone ? 'border-rose-500 ring-rose-500/20' : 'border-gray-300'
                                        )}
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1.5 mb-1 text-right">(Tùy chọn)</p>
                                    {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone.message}</p>}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                                        Tiêu đề <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        {...register('subject')}
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-xl text-sm bg-white border transition-all outline-none cursor-pointer text-gray-700',
                                            'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                            errors.subject ? 'border-rose-500 ring-rose-500/20' : 'border-gray-300'
                                        )}
                                    >
                                        <option value="">Chọn chủ đề...</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject.message}</p>}
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                                        Nội dung <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('message')}
                                        rows={5}
                                        placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
                                        className={cn(
                                            'w-full px-4 py-2.5 rounded-xl text-sm bg-white border transition-all outline-none resize-none',
                                            'placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500',
                                            errors.message ? 'border-rose-500 ring-rose-500/20' : 'border-gray-300'
                                        )}
                                    />
                                    {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message.message}</p>}
                                </div>

                                <Button
                                    type="submit"
                                    size="lg"
                                    disabled={mutation.isPending}
                                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 border-0 shadow-sm font-semibold transition-all"
                                >
                                    {mutation.isPending ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang gửi...</>
                                    ) : (
                                        <><Send className="w-4 h-4 mr-2" />Gửi tin nhắn</>
                                    )}
                                </Button>
                            </form>

                            {/* Social links */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-500 mb-4 text-center">Hoặc liên hệ qua mạng xã hội</p>
                                <div className="flex gap-3 justify-center">
                                    {SOCIALS.map(s => {
                                        const Icon = s.icon;
                                        return (
                                            <motion.a key={s.label} href={s.href} aria-label={s.label}
                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                className={cn('p-2.5 rounded-xl bg-gray-50 border border-gray-200 transition-colors', s.color)}>
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
                            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="h-72 bg-gray-100 relative">
                                    <iframe
                                        title="JOBIO Office Location"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4349!2d106.69924!3d10.77626!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3a9d8d1bb5%3A0x5c3c6be89e08c7a!2sSaigon%20Centre!5e0!3m2!1svi!2svn!4v1620000000000!5m2!1svi!2svn"
                                        className="w-full h-full transition-opacity"
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-50 rounded-lg shrink-0">
                                            <MapPin className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">JOBIO Headquarters</p>
                                            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                                Tầng 12, Tòa nhà Saigon Centre<br />
                                                65 Lê Lợi, Quận 1, TP. Hồ Chí Minh
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        {/* Business hours */}
                        <FadeIn delay={0.15}>
                            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2 bg-amber-50 rounded-lg">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Giờ làm việc</h3>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { day: 'Thứ 2 – Thứ 6', hours: '08:00 – 18:00', open: true },
                                        { day: 'Thứ 7', hours: '08:00 – 12:00', open: true },
                                        { day: 'Chủ nhật', hours: 'Đóng cửa', open: false },
                                    ].map(item => (
                                        <div key={item.day} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 last:pb-0">
                                            <span className="text-sm font-medium text-gray-700">{item.day}</span>
                                            <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full text-center min-w-[100px]',
                                                item.open ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                                            )}>
                                                {item.hours}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                                    <Headphones className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 mb-1">Hotline hỗ trợ 24/7</p>
                                        <p className="text-sm text-gray-600">
                                            <strong className="text-indigo-600 text-lg mr-1">1800 599 984</strong><br />
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
