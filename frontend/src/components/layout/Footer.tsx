import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Github, ArrowUpRight } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';

const footerNav = [
    {
        title: 'Ứng Viên',
        links: [
            { label: 'Tìm Việc Làm', to: '/jobs' },
            { label: 'Danh Sách Công Ty', to: '/companies' },
            { label: 'Việc Làm Theo Ngành', to: '/jobs' },
            { label: 'Bài Viết Nghề Nghiệp', to: '/blog' },
        ],
    },
    {
        title: 'Nhà Tuyển Dụng',
        links: [
            { label: 'Đăng Tin Tuyển Dụng', to: '/auth?mode=register' },
            { label: 'Gói Dịch Vụ', to: '/pricing' },
            { label: 'Giải Pháp HR', to: '/hr-solutions' },
        ],
    },
    {
        title: 'Về JOBIO',
        links: [
            { label: 'Về Chúng Tôi', to: '/about' },
            { label: 'Liên Hệ', to: '/contact' },
            { label: 'FAQ', to: '/faq' },
            { label: 'Blog', to: '/blog' },
        ],
    },
];

const socials = [
    { Icon: Facebook, href: '#', label: 'Facebook' },
    { Icon: Twitter, href: '#', label: 'Twitter' },
    { Icon: Linkedin, href: '#', label: 'LinkedIn' },
    { Icon: Instagram, href: '#', label: 'Instagram' },
    { Icon: Github, href: '#', label: 'GitHub' },
];

export const Footer = () => (
    <>
        {/* Top section — CTA Banner Section on Page Background */}
        <section className="bg-background py-8 lg:py-10 relative z-10 border-b border-border/40">
            <div className="container mx-auto px-4">
                <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8 lg:p-10 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-950 border border-teal-500/25 shadow-xl shadow-teal-900/10">
                    {/* Ambient glow inside card */}
                    <div
                        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, oklch(0.55 0.15 175 / 0.3) 0%, transparent 70%)' }}
                    />
                    <div
                        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, oklch(0.70 0.14 85 / 0.15) 0%, transparent 70%)' }}
                    />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="max-w-2xl lg:max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-3">
                                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                                Bắt đầu ngay hôm nay
                            </div>
                            <h3
                                className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug mb-2 text-white"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                Sẵn sàng kết nối với
                                <span className="text-teal-300"> cơ hội mới</span>?
                            </h3>
                            <p className="text-white/80 text-xs sm:text-sm font-normal leading-relaxed">
                                Hàng nghìn vị trí đang chờ bạn trên JOBIO — nền tảng tuyển dụng hàng đầu Việt Nam.
                            </p>
                        </div>

                        <Link
                            to="/jobs"
                            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 text-slate-950 text-xs font-extrabold tracking-wide uppercase shadow-md shadow-teal-500/30 hover:shadow-teal-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 w-fit shrink-0"
                        >
                            Khám phá ngay
                            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>

        {/* Main Footer — ONLY this part has dark black background */}
        <footer className="relative bg-[oklch(0.08_0.025_175)] text-white overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-teal-light)] to-transparent opacity-50" />

            {/* Decorative noise texture */}
            <div className="absolute inset-0 pointer-events-none noise-texture opacity-30" />

            {/* Diagonal accent line pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                    backgroundImage: `repeating-linear-gradient(-45deg, oklch(0.65 0.14 175 / 0.4) 0px, oklch(0.65 0.14 175 / 0.4) 1px, transparent 1px, transparent 32px)`,
                }}
            />

            <div className="container mx-auto px-4 relative z-10 pt-1 pb-1">
                {/* Main footer grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 py-4 lg:py-5">
                    {/* Brand column — asymmetric wider */}
                    <div className="lg:col-span-2 space-y-2.5">
                        <Logo
                            to="/"
                            imageClassName="h-7 w-auto object-contain drop-shadow"
                            textClassName="text-xl font-black text-teal-300"
                        />
                        <p className="text-white/40 text-xs leading-relaxed max-w-xs font-light">
                            Nền tảng tuyển dụng hàng đầu Việt Nam — kết nối ứng viên tài năng với doanh nghiệp hàng đầu mỗi ngày.
                        </p>
                        {/* Social icons — refined hover states */}
                        <div className="flex gap-2 pt-0.5">
                            {socials.map(({ Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="w-8 h-8 rounded-lg bg-card/[0.04] hover:bg-gradient-to-br hover:from-teal-500/70 hover:to-emerald-500/70 border border-white/[0.06] hover:border-teal-500/30 flex items-center justify-center text-white/30 hover:text-white transition-all duration-300"
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns — editorial typography */}
                    {footerNav.map(section => (
                        <div key={section.title}>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-2.5 editorial-line pt-1">
                                {section.title}
                            </h4>
                            <ul className="space-y-1.5">
                                {section.links.map(link => (
                                    <li key={link.label}>
                                        <Link
                                            to={link.to}
                                            className="text-xs text-white/60 hover:text-teal-400 transition-colors duration-300 font-medium inline-flex items-center gap-1 group"
                                        >
                                            {link.label}
                                            <ArrowUpRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.06] py-2.5 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-white/30">
                    <span className="font-light">© 2026 JOBIO</span>
                    <div className="flex gap-5">
                        <Link to="/terms" className="hover:text-teal-400 transition-colors duration-300">Điều Khoản</Link>
                        <Link to="/privacy" className="hover:text-teal-400 transition-colors duration-300">Bảo Mật</Link>
                        <Link to="/cookie" className="hover:text-teal-400 transition-colors duration-300">Cookie</Link>
                    </div>
                </div>
            </div>
        </footer>
    </>
);
