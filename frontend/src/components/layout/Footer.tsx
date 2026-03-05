import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

const footerNav = [
    {
        title: 'Ứng Viên',
        links: [
            { label: 'Tìm Việc Làm', to: '/jobs' },
            { label: 'Danh Sách Công Ty', to: '/companies' },
            { label: 'Việc Làm Theo Ngành', to: '/jobs' },
            { label: 'Bài Viết Nghề Nghiệp', to: '#' },
        ],
    },
    {
        title: 'Nhà Tuyển Dụng',
        links: [
            { label: 'Đăng Tin Tuyển Dụng', to: '/employer/register' },
            { label: 'Gói Dịch Vụ', to: '/pricing' },
            { label: 'Giải Pháp HR', to: '#' },
        ],
    },
    {
        title: 'Về JOBIO',
        links: [
            { label: 'Về Chúng Tôi', to: '/about' },
            { label: 'Liên Hệ', to: '/contact' },
            { label: 'FAQ', to: '/faq' },
            { label: 'Blog', to: '#' },
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
    <footer className="bg-gray-900 text-white mt-0">
        <div className="container mx-auto px-4 pt-14 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mb-10">
                {/* Brand column */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="text-2xl font-black tracking-tight">
                        <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">JOBIO</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                        Nền tảng tuyển dụng hàng đầu Việt Nam — kết nối ứng viên tài năng với doanh nghiệp hàng đầu mỗi ngày.
                    </p>
                    {/* Social buttons */}
                    <div className="flex gap-2">
                        {socials.map(({ Icon, href, label }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-gradient-to-br hover:from-primary/80 hover:to-cyan-500/80 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                            >
                                <Icon className="w-4 h-4" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Link columns */}
                {footerNav.map(section => (
                    <div key={section.title}>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">{section.title}</h4>
                        <ul className="space-y-2.5">
                            {section.links.map(link => (
                                <li key={link.label}>
                                    <Link to={link.to} className="text-sm text-gray-400 hover:text-white transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
                <span>© 2026 JOBIO. Bảo lưu mọi quyền.</span>
                <div className="flex gap-5">
                    <Link to="#" className="hover:text-gray-400 transition-colors">Điều Khoản</Link>
                    <Link to="#" className="hover:text-gray-400 transition-colors">Bảo Mật</Link>
                    <Link to="#" className="hover:text-gray-400 transition-colors">Cookie</Link>
                </div>
            </div>
        </div>
    </footer>
);
