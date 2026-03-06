import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Search, MapPin, Briefcase, Building, Users,
    ArrowRight, DollarSign, Clock, Wifi, ChevronRight,
    Monitor, Landmark, Factory, ShoppingBag, Headphones,
    Laptop, Megaphone, PenTool, PieChart, Stethoscope, GraduationCap,
    Home as HomeIcon
} from "lucide-react";
import { taxonomyService } from "../services/taxonomyService";
import { jobService } from "../services/jobService";
import { companyService } from "../services/companyService";
import { dashboardService } from "../services/dashboardService";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
    const mainRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sections = gsap.utils.toArray<HTMLElement>('.reveal-section');
        sections.forEach((section) => {
            gsap.fromTo(section,
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 88%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }, []);

    return (
        <div ref={mainRef} className="w-full flex flex-col gap-24 pb-0 bg-white">
            <HeroSection />
            <div className="reveal-section"><StatsSection /></div>
            <div className="reveal-section"><FeaturedJobsSection /></div>
            <div className="reveal-section"><JobCategoriesSection /></div>
            <div className="reveal-section"><FeaturedCompaniesSection /></div>
            <div className="reveal-section"><IndustriesSection /></div>
            <HomeFooter />
        </div>
    );
}

/* ─────────────────────────── HERO ─────────────────────────── */
const HeroSection = () => {
    const [keyword, setKeyword] = useState('');
    const [province, setProvince] = useState('');
    const navigate = useNavigate();

    const { data: provinces } = useQuery({
        queryKey: ['provinces'],
        queryFn: () => taxonomyService.listProvinces().then(r => r.data.results),
    });

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (keyword) params.set('search', keyword);
        if (province) params.set('province', province);
        navigate(`/jobs?${params.toString()}`);
    };

    return (
        <section className="relative pt-36 pb-24 overflow-hidden" style={{
            background: 'linear-gradient(145deg, oklch(0.92 0.06 265) 0%, oklch(0.95 0.04 280) 30%, oklch(0.97 0.02 220) 60%, #f8faff 100%)'
        }}>
            {/* === BACKGROUND LAYERS (bottom to top) === */}

            {/* Layer 1: Large saturated blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Left violet blob */}
                <div className="hero-blob absolute -top-24 -left-32 w-[560px] h-[560px] rounded-full"
                    style={{ background: 'radial-gradient(circle at 40% 40%, oklch(0.68 0.22 275 / 0.32) 0%, transparent 65%)' }} />
                {/* Right cyan blob */}
                <div className="hero-blob-alt absolute top-4 -right-24 w-[480px] h-[480px] rounded-full"
                    style={{ background: 'radial-gradient(circle at 60% 30%, oklch(0.72 0.18 205 / 0.28) 0%, transparent 65%)' }} />
                {/* Bottom-center rose blob */}
                <div className="hero-blob absolute -bottom-16 left-[35%] w-[400px] h-[400px] rounded-full"
                    style={{ background: 'radial-gradient(circle at 50% 60%, oklch(0.76 0.15 340 / 0.22) 0%, transparent 65%)' }} />
            </div>

            {/* Layer 2: Dot grid — more visible */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `radial-gradient(circle, oklch(0.50 0.20 265 / 0.20) 1.5px, transparent 1.5px)`,
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Layer 3: Diagonal lines for texture depth */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        oklch(0.5 0.20 265) 0px,
                        oklch(0.5 0.20 265) 1px,
                        transparent 1px,
                        transparent 24px
                    )`,
                }}
            />

            {/* Layer 4: Radial fade-in from center (keeps text area clean) */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 60% 55% at 50% 45%, rgba(255,255,255,0.55) 0%, transparent 100%)' }}
            />

            {/* Top gradient accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-primary to-cyan-400" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="max-w-4xl mx-auto text-center"
                >
                    {/* eyebrow tag */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm text-primary text-sm font-semibold mb-6 border border-primary/20 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Nền tảng tuyển dụng hàng đầu Việt Nam
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight text-gray-900 mb-6">
                        Tìm Việc Làm{' '}
                        <span className="bg-gradient-to-r from-primary via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                            Phù Hợp
                        </span>
                        {' '}Với Bạn
                    </h1>

                    <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Kết nối ứng viên tài năng với hàng nghìn doanh nghiệp hàng đầu.
                        Cơ hội nghề nghiệp được cập nhật mỗi ngày.
                    </p>

                    {/* Search bar */}
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/80 p-3 flex flex-col lg:flex-row gap-3 max-w-3xl mx-auto">
                        <div className="flex items-center flex-[2] border border-gray-200 rounded-xl px-4 py-3 gap-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-white">
                            <Search className="w-5 h-5 text-gray-400 shrink-0" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Chức danh, kỹ năng, công ty..."
                                className="w-full bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-400 text-base"
                            />
                        </div>
                        <div className="flex items-center flex-1 border border-gray-200 rounded-xl px-4 py-3 gap-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all bg-white">
                            <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                            <select
                                value={province}
                                onChange={e => setProvince(e.target.value)}
                                className="w-full bg-transparent border-none outline-none appearance-none text-gray-800 cursor-pointer text-base"
                            >
                                <option value="">Toàn quốc</option>
                                {provinces?.map((p: any) => (
                                    <option key={p.id} value={p.province_name}>{p.province_name}</option>
                                ))}
                            </select>
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="lg:w-40 py-6 rounded-xl bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-500 text-white font-bold text-base shadow-lg shadow-primary/30 transition-all"
                        >
                            Tìm Kiếm
                        </Button>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                        <Link to="/jobs">
                            <Button variant="outline" className="rounded-xl border-gray-300 bg-white/80 backdrop-blur-sm px-6 h-11 font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors group shadow-sm">
                                Tìm Việc Ngay
                                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/employer/register">
                            <Button className="rounded-xl px-6 h-11 font-semibold bg-gradient-to-r from-violet-600 to-primary text-white shadow-md shadow-violet-500/30 hover:opacity-90 transition-opacity">
                                Đăng Tin Miễn Phí
                            </Button>
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/80"><span className="text-green-500">✓</span> Miễn phí đăng ký</span>
                        <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/80"><span className="text-green-500">✓</span> Cập nhật mỗi ngày</span>
                        <span className="flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/80"><span className="text-green-500">✓</span> Bảo mật thông tin</span>
                    </div>
                </motion.div>
            </div>

            {/* Wave divider bottom — pure bezier, no sharp kinks */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 block">
                    <path d="M0,40 C180,65 360,10 540,35 C720,58 900,8 1080,30 C1260,52 1350,20 1440,32 L1440,60 L0,60 Z" fill="white" />
                </svg>
            </div>
        </section>
    );

};

/* ─────────────────────────── STATS ─────────────────────────── */
const StatsSection = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats'],
        queryFn: () => dashboardService.getAdminStats().then(r => r.data)
    });

    const [counters, setCounters] = useState({ jobs: 0, companies: 0, users: 0 });

    useEffect(() => {
        if (stats) {
            const tl = gsap.timeline({
                scrollTrigger: { trigger: "#stats-section", start: "top 80%" }
            });
            tl.to(counters, {
                jobs: stats.total_jobs,
                companies: stats.total_companies,
                users: stats.total_users,
                duration: 2,
                roundProps: "jobs,companies,users",
                onUpdate: () => setCounters({ ...counters }),
                ease: "expo.out"
            });
        }
    }, [stats]);

    const items = [
        {
            icon: Briefcase,
            label: "Việc Làm Đang Tuyển",
            value: counters.jobs,
            color: "from-violet-500 to-primary",
            bg: "bg-violet-50",
            iconBg: "bg-gradient-to-br from-violet-500 to-primary",
        },
        {
            icon: Building,
            label: "Doanh Nghiệp",
            value: counters.companies,
            color: "from-cyan-500 to-blue-500",
            bg: "bg-cyan-50",
            iconBg: "bg-gradient-to-br from-cyan-500 to-blue-500",
        },
        {
            icon: Users,
            label: "Ứng Viên",
            value: counters.users,
            color: "from-emerald-500 to-teal-500",
            bg: "bg-emerald-50",
            iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
        },
    ];

    if (isLoading) return (
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
        </div>
    );

    return (
        <section id="stats-section" className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {items.map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                        className={`${stat.bg} rounded-2xl p-8 flex items-center gap-6 border border-white shadow-sm`}
                    >
                        <div className={`${stat.iconBg} w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-md shrink-0`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="text-4xl font-black text-gray-900 tracking-tight">
                                {stat.value.toLocaleString('vi-VN')}<span className="text-primary text-2xl">+</span>
                            </div>
                            <div className="text-sm font-semibold text-gray-500 mt-0.5">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

/* ────────────────────────── FEATURED JOBS ────────────────────── */
const FeaturedJobsSection = () => {
    const { data: jobs, isLoading } = useQuery({
        queryKey: ['featuredJobs'],
        queryFn: () => jobService.featured().then(r => r.data.results)
    });

    return (
        <section className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Việc Làm Nổi Bật</h2>
                    <p className="text-gray-500 mt-1">Các cơ hội việc làm được tuyển chọn từ các doanh nghiệp hàng đầu</p>
                </div>
                <Link to="/jobs">
                    <Button variant="outline" className="rounded-xl border-gray-300 font-semibold text-gray-700 hover:border-primary hover:text-primary group transition-colors">
                        Xem tất cả <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {isLoading
                    ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
                    : jobs?.map((job: any) => <JobCard key={job.id} job={job} />)}
            </div>
        </section>
    );
};

const JobCard = ({ job }: { job: any }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            whileHover={{ y: -4, boxShadow: '0 12px 32px -8px rgba(0,0,0,0.12)' }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 cursor-pointer group hover:border-primary/30 transition-all"
            onClick={() => navigate(`/jobs/${job.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-2 shrink-0">
                    <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <Badge className="rounded-full px-3 py-0.5 bg-primary/10 text-primary border-none text-[11px] font-bold uppercase tracking-wide">
                        {job.job_type}
                    </Badge>
                    {job.is_remote && (
                        <Badge variant="outline" className="rounded-full px-3 py-0.5 border-cyan-300 text-cyan-600 text-[11px] font-bold uppercase">
                            Remote
                        </Badge>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {job.title}
                </h3>
                <button
                    className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 transition-colors"
                    onClick={e => { e.stopPropagation(); navigate(`/companies/${job.id}`); }}
                >
                    <Building className="w-3.5 h-3.5" /> {job.company_name}
                </button>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 space-y-1.5">
                <div className="flex items-center text-sm text-gray-400 gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{job.locations}</span>
                </div>
                {job.deadline && (
                    <div className="flex items-center text-sm text-gray-400 gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}</span>
                    </div>
                )}
                {job.is_salary_visible ? (
                    <div className="flex items-center text-sm font-semibold text-primary gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {job.salary_min?.toLocaleString('vi-VN')} – {job.salary_max?.toLocaleString('vi-VN')}
                        <span className="text-xs text-gray-400 font-normal ml-0.5">{job.salary_currency}</span>
                    </div>
                ) : (
                    <div className="text-sm text-gray-400 italic">Thỏa thuận</div>
                )}
            </div>

            {/* Hover CTA */}
            <Button
                className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold text-sm shadow-sm shadow-primary/20 opacity-0 group-hover:opacity-100 -mt-1 transition-opacity"
                onClick={e => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
            >
                Ứng Tuyển Nhanh
            </Button>
        </motion.div>
    );
};

/* ────────────────────────── CATEGORIES ────────────────────────── */
const JobCategoriesSection = () => {
    const navigate = useNavigate();
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => taxonomyService.listJobCategories().then(r => r.data.results)
    });

    const getCategoryIcon = (name: string) => {
        const map: Record<string, any> = {
            Laptop, Megaphone, PenTool, PieChart, Stethoscope, GraduationCap
        };
        const Icon = map[name] || Briefcase;
        return <Icon className="w-6 h-6" />;
    };

    const gradients = [
        "from-violet-500 to-primary",
        "from-cyan-500 to-blue-500",
        "from-emerald-500 to-teal-500",
        "from-orange-500 to-amber-500",
        "from-rose-500 to-pink-500",
        "from-indigo-500 to-violet-500",
    ];

    return (
        <section className="bg-gray-50 py-16 -mx-0 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Danh Mục Nghề Nghiệp</h2>
                    <p className="text-gray-500 mt-1">Khám phá cơ hội việc làm theo từng lĩnh vực</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {isLoading
                        ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
                        : categories?.map((cat: any, i: number) => (
                            <motion.div
                                key={cat.id}
                                whileHover={{ y: -6, scale: 1.02 }}
                                transition={{ duration: 0.18 }}
                                onClick={() => navigate(`/jobs?category=${cat.slug}`)}
                                className="bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 cursor-pointer group border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all"
                            >
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center text-white shadow-sm`}>
                                    {getCategoryIcon(cat.icon_url)}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-800 text-sm group-hover:text-primary transition-colors">{cat.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{cat.job_count} việc làm</div>
                                </div>
                            </motion.div>
                        ))}
                </div>
            </div>
        </section>
    );
};

/* ────────────────────────── COMPANIES ────────────────────────── */
const FeaturedCompaniesSection = () => {
    const navigate = useNavigate();
    const { data: companies, isLoading } = useQuery({
        queryKey: ['featuredCompanies'],
        queryFn: () => companyService.featured().then(r => r.data.results)
    });

    return (
        <section className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Công Ty Nổi Bật</h2>
                    <p className="text-gray-500 mt-1">Đối tác tuyển dụng uy tín từ khắp mọi ngành nghề</p>
                </div>
                <Link to="/companies">
                    <Button variant="outline" className="rounded-xl border-gray-300 font-semibold text-gray-700 hover:border-primary hover:text-primary group transition-colors">
                        Tất cả công ty <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
                {isLoading
                    ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
                    : companies?.map((company: any) => (
                        <motion.div
                            key={company.id}
                            whileHover={{ y: -5 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center text-center gap-3 cursor-pointer group hover:border-primary/30 hover:shadow-md transition-all relative overflow-hidden"
                            onClick={() => navigate(`/companies/${company.id}`)}
                        >
                            <div className="w-16 h-16 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center p-3 group-hover:scale-105 transition-transform">
                                <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-1">
                                <div className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{company.company_name}</div>
                                {company.industry?.name && (
                                    <div className="text-xs text-primary font-semibold bg-primary/8 px-2 py-0.5 rounded-full inline-block">{company.industry.name}</div>
                                )}
                                <div className="text-xs text-gray-400">{company.job_count} vị trí</div>
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-5 rounded-2xl">
                                <span className="text-white text-sm font-bold">Xem Việc Làm →</span>
                            </div>
                        </motion.div>
                    ))}
            </div>
        </section>
    );
};

/* ────────────────────────── INDUSTRIES ────────────────────────── */
const IndustriesSection = () => {
    const { data: industries, isLoading } = useQuery({
        queryKey: ['industries'],
        queryFn: () => taxonomyService.listIndustries().then(r => r.data.results)
    });

    const getIcon = (name: string) => {
        const icons: any = { Monitor, Landmark, Home: HomeIcon, Factory, ShoppingBag, Headphones, Wifi };
        const Icon = icons[name] || Building;
        return <Icon className="w-5 h-5" />;
    };

    return (
        <section className="bg-gray-50 py-16 px-4 -mx-0">
            <div className="container mx-auto">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    <div className="lg:w-1/3 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-3">Ngành Nghề Đa Dạng</h2>
                        <p className="text-gray-500 leading-relaxed mb-6">
                            Trên 30 lĩnh vực nghề nghiệp với hàng nghìn cơ hội từ công nghệ đến tài chính, y tế và nhiều hơn nữa.
                        </p>
                        <Link to="/jobs">
                            <Button className="rounded-xl px-6 h-11 bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-md shadow-primary/30 hover:opacity-90 transition-opacity">
                                Khám Phá Tất Cả
                            </Button>
                        </Link>
                    </div>

                    <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 w-full">
                        {isLoading
                            ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                            : industries?.map((ind: any) => (
                                <motion.div
                                    key={ind.id}
                                    whileHover={{ x: 3 }}
                                    transition={{ duration: 0.15 }}
                                    className="bg-white flex items-center gap-4 px-4 py-3.5 rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm cursor-pointer group transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary/80 group-hover:text-white transition-all shrink-0">
                                        {getIcon(ind.icon_url)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-primary transition-colors truncate">{ind.name}</div>
                                        <div className="text-xs text-gray-400">{ind.company_count} công ty</div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary ml-auto shrink-0 transition-colors" />
                                </motion.div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

<<<<<<< HEAD
=======

>>>>>>> 770d0db2370ad5ba42246855d6a3201b9c4caf98
