import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Target, Eye, Users, Globe, Calendar, Zap, Heart, Sparkles,
    TrendingUp, Shield, ArrowRight, Star, Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ─── Fade-in helper ─── */
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ─── Animated counter ─── */
function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.3 }}
        >
            <motion.span
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
            >
                {inView ? (
                    <motion.span
                        initial={{ innerText: 0 } as any}
                        animate={{ innerText: value } as any}
                        transition={{ duration: 1.4, ease: 'easeOut' }}
                    >
                        {value}
                    </motion.span>
                ) : 0}
            </motion.span>
            {suffix}
        </motion.span>
    );
}

/* ─── Data ─── */
const TEAM = [
    { name: 'Nguyễn Minh Khoa', role: 'CEO & Co-Founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khoa', tag: 'Founder' },
    { name: 'Trần Thị Lan', role: 'CTO & Co-Founder', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lan', tag: 'Tech' },
    { name: 'Lê Đức Anh', role: 'Head of Product', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anh', tag: 'Product' },
    { name: 'Phạm Thu Hà', role: 'Head of Design', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ha', tag: 'Design' },
    { name: 'Võ Hữu Toàn', role: 'Lead Engineer', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Toan', tag: 'Engineering' },
    { name: 'Đặng Thị Bích', role: 'Head of Marketing', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bich', tag: 'Marketing' },
];

const TIMELINE = [
    { year: '2020', title: 'Ra mắt JOBIO', desc: 'Khởi động với 500 công ty và 10.000 ứng viên đầu tiên tại TP.HCM.' },
    { year: '2021', title: 'Mở rộng toàn quốc', desc: 'Phủ sóng 63 tỉnh thành, vượt mốc 100.000 người dùng.' },
    { year: '2022', title: 'Al Matching Engine', desc: 'Ra mắt tính năng gợi ý việc làm thông minh dựa trên AI đầu tiên tại Việt Nam.' },
    { year: '2023', title: 'Series A - $5M', desc: 'Gọi vốn thành công, mở rộng đội ngũ lên 150 nhân viên.' },
    { year: '2024', title: 'JOBIO 3.0', desc: 'Nền tảng thế hệ mới với UX premium, real-time matching và enterprise tools.' },
];

const VALUES = [
    { icon: Heart, title: 'Tận tâm', desc: 'Mỗi tính năng được thiết kế vì con người – ứng viên và nhà tuyển dụng.', color: 'from-rose-500/20 to-pink-500/10' },
    { icon: Zap, title: 'Đổi mới', desc: 'Ứng dụng AI và công nghệ mới nhất để nâng cao trải nghiệm liên tục.', color: 'from-amber-500/20 to-yellow-500/10' },
    { icon: Shield, title: 'Tin cậy', desc: 'Dữ liệu an toàn, thông tin minh bạch, quy trình đáng tin cậy.', color: 'from-emerald-500/20 to-green-500/10' },
    { icon: TrendingUp, title: 'Tăng trưởng', desc: 'Đồng hành cùng sự nghiệp của từng cá nhân và chiến lược tuyển dụng của doanh nghiệp.', color: 'from-cyan-500/20 to-blue-500/10' },
    { icon: Globe, title: 'Toàn cầu', desc: 'Kết nối tài năng Việt Nam với cơ hội quốc tế trên toàn thế giới.', color: 'from-violet-500/20 to-purple-500/10' },
    { icon: Sparkles, title: 'Xuất sắc', desc: 'Không dừng ở "đủ tốt" — cam kết mang đến trải nghiệm xuất sắc nhất.', color: 'from-sky-500/20 to-indigo-500/10' },
];

const STATS = [
    { label: 'Thành lập', value: '2020', unit: '' },
    { label: 'Nhân viên', value: '150+', unit: '' },
    { label: 'Quốc gia', value: '5', unit: '' },
    { label: 'Ứng viên', value: '500K+', unit: '' },
];

/* ─── Component ─── */
export default function About() {
    return (
        <div className="relative min-h-screen">
            {/* ── Hero ── */}
            <section className="relative pt-28 pb-20 px-4 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center">
                    <FadeIn>
                        <Badge className="mb-4 glass-effect border-cyan-400/30 text-cyan-400 px-4 py-1.5 text-sm">
                            <Star className="w-3.5 h-3.5 mr-1.5 inline" />
                            Về chúng tôi
                        </Badge>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-cyan-100 to-violet-200 bg-clip-text text-transparent dark:from-white dark:via-cyan-100 dark:to-violet-200">
                            Kết nối tài năng với{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-500">
                                cơ hội đích thực
                            </span>
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-lg text-foreground/60 max-w-2xl mx-auto leading-relaxed">
                            JOBIO là nền tảng tuyển dụng thế hệ mới — nơi AI và thiết kế premium cộng hưởng
                            để tạo ra trải nghiệm kết nối tài năng và cơ hội chưa từng có tại Việt Nam.
                        </p>
                    </FadeIn>
                </div>

                {/* Decorative orbs */}
                <div className="absolute top-20 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* ── Company Stats ── */}
            <section className="py-14 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {STATS.map((stat, i) => (
                            <FadeIn key={stat.label} delay={i * 0.08}>
                                <div className="glass-card-tinted rounded-2xl p-6 text-center border border-white/10">
                                    <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent mb-1">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-foreground/60">{stat.label}</div>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Mission / Vision ── */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                    <FadeIn>
                        <div className={cn(
                            "glass-card-tinted rounded-2xl p-8 border border-white/10 h-full",
                            "bg-gradient-to-br from-cyan-500/10 to-blue-500/5"
                        )}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-cyan-500/20">
                                    <Target className="w-5 h-5 text-cyan-400" />
                                </div>
                                <h2 className="text-xl font-bold">Sứ mệnh</h2>
                            </div>
                            <p className="text-foreground/70 leading-relaxed text-base">
                                Dân chủ hóa cơ hội nghề nghiệp — xóa bỏ rào cản thông tin và tạo ra sân chơi bình đẳng
                                cho mọi tài năng Việt Nam, dù ở thành thị hay vùng sâu vùng xa.
                            </p>
                        </div>
                    </FadeIn>
                    <FadeIn delay={0.1}>
                        <div className={cn(
                            "glass-card-tinted rounded-2xl p-8 border border-white/10 h-full",
                            "bg-gradient-to-br from-violet-500/10 to-purple-500/5"
                        )}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-violet-500/20">
                                    <Eye className="w-5 h-5 text-violet-400" />
                                </div>
                                <h2 className="text-xl font-bold">Tầm nhìn</h2>
                            </div>
                            <p className="text-foreground/70 leading-relaxed text-base">
                                Trở thành nền tảng tuyển dụng AI hàng đầu Đông Nam Á vào 2027, nơi mỗi
                                hành trình sự nghiệp được cá nhân hóa và mỗi vị trí tuyển dụng được lấp đầy
                                bởi ứng viên phù hợp nhất.
                            </p>
                        </div>
                    </FadeIn>
                </div>
            </section>

            {/* ── Timeline ── */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-3">Hành trình phát triển</h2>
                            <p className="text-foreground/60">Từ ý tưởng táo bạo đến nền tảng tuyển dụng hàng đầu Việt Nam.</p>
                        </div>
                    </FadeIn>

                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-violet-500/40 to-transparent" />

                        <div className="space-y-8">
                            {TIMELINE.map((item, i) => (
                                <FadeIn key={item.year} delay={i * 0.08}>
                                    <div className="flex gap-6">
                                        <div className="relative shrink-0">
                                            <div className="w-12 h-12 rounded-full glass-card-tinted border border-cyan-400/30 flex items-center justify-center z-10 relative">
                                                <Calendar className="w-4 h-4 text-cyan-400" />
                                            </div>
                                        </div>
                                        <div className="glass-card-tinted rounded-2xl p-5 flex-1 border border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Badge variant="outline" className="text-xs border-cyan-400/40 text-cyan-400">
                                                    {item.year}
                                                </Badge>
                                                <h3 className="font-semibold">{item.title}</h3>
                                            </div>
                                            <p className="text-sm text-foreground/60">{item.desc}</p>
                                        </div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Team ── */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-3">Đội ngũ lãnh đạo</h2>
                            <p className="text-foreground/60">Những con người đằng sau JOBIO — đam mê, tầm nhìn và năng lượng không ngừng.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                        {TEAM.map((member, i) => (
                            <FadeIn key={member.name} delay={i * 0.07}>
                                <motion.div
                                    whileHover={{ y: -4, scale: 1.02 }}
                                    transition={{ duration: 0.2 }}
                                    className="glass-card-tinted rounded-2xl p-6 border border-white/10 text-center group cursor-default"
                                >
                                    <div className="relative inline-block mb-4">
                                        <img
                                            src={member.avatar}
                                            alt={member.name}
                                            className="w-20 h-20 rounded-full border-2 border-cyan-400/30 bg-white/5"
                                        />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
                                            <Users className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-sm mb-1">{member.name}</h3>
                                    <p className="text-xs text-foreground/60 mb-2">{member.role}</p>
                                    <Badge className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border-cyan-400/20">
                                        {member.tag}
                                    </Badge>
                                </motion.div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Core Values ── */}
            <section className="py-16 px-4">
                <div className="max-w-5xl mx-auto">
                    <FadeIn>
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-3">Giá trị cốt lõi</h2>
                            <p className="text-foreground/60">Những nguyên tắc không thay đổi định hướng mọi quyết định tại JOBIO.</p>
                        </div>
                    </FadeIn>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {VALUES.map((val, i) => {
                            const Icon = val.icon;
                            return (
                                <FadeIn key={val.title} delay={i * 0.06}>
                                    <motion.div
                                        whileHover={{ y: -4 }}
                                        transition={{ duration: 0.2 }}
                                        className={cn(
                                            "rounded-2xl p-6 border border-white/10 h-full",
                                            "bg-gradient-to-br",
                                            val.color,
                                            "glass-card-tinted"
                                        )}
                                    >
                                        <Icon className="w-8 h-8 mb-4 text-foreground/80" />
                                        <h3 className="font-bold text-lg mb-2">{val.title}</h3>
                                        <p className="text-sm text-foreground/60 leading-relaxed">{val.desc}</p>
                                    </motion.div>
                                </FadeIn>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-4">
                <div className="max-w-2xl mx-auto">
                    <FadeIn>
                        <div className="glass-card-tinted rounded-3xl p-10 border border-white/10 text-center bg-gradient-to-br from-cyan-500/10 to-violet-500/10 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 blur-xl" />
                            <div className="relative z-10">
                                <Building2 className="w-10 h-10 mx-auto mb-4 text-cyan-400" />
                                <h2 className="text-2xl font-bold mb-3">Sẵn sàng bắt đầu?</h2>
                                <p className="text-foreground/60 mb-6 text-sm">
                                    Tham gia cùng hơn 500.000 ứng viên và 15.000 nhà tuyển dụng đang sử dụng JOBIO mỗi ngày.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button asChild size="lg" className="bg-gradient-to-r from-cyan-500 to-violet-600 text-white border-0 hover:from-cyan-400 hover:to-violet-500">
                                        <Link to="/auth">
                                            Đăng ký ngay
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="glass-effect border-white/20">
                                        <Link to="/jobs">Khám phá việc làm</Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
