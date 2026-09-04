import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
    Search, MapPin, Briefcase, Building, Users,
    ArrowRight, DollarSign, Clock, Wifi, ChevronRight,
    Monitor, Landmark, Factory, ShoppingBag, Headphones,
    Home as HomeIcon,
    Bot, Code, Target, Palette, Bug, ArrowUpRight,
} from "lucide-react";
import { taxonomyService } from "../services/taxonomyService";
import { jobService } from "../services/jobService";
import { companyService } from "../services/companyService";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Combobox } from "../components/ui/combobox";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FEATURED_JOBS_LIMIT = 8;

const unwrapList = <T,>(value: T[] | { results?: T[] } | null | undefined): T[] => (
    Array.isArray(value) ? value : (value?.results ?? [])
);

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
        <div ref={mainRef} className="w-full flex flex-col gap-0 pb-0 bg-background">
            <HeroSection />
            <div className="reveal-section"><StatsSection /></div>
            <div className="reveal-section"><FeaturedJobsSection /></div>
            <div className="reveal-section"><JobCategoriesSection /></div>
            <div className="reveal-section"><FeaturedCompaniesSection /></div>
            <div className="reveal-section"><IndustriesSection /></div>
        </div>
    );
}

/* ─────────────────────────── HERO ─────────────────────────── */
const HeroSection = () => {
    const [keyword, setKeyword] = useState('');
    const [province, setProvince] = useState('');
    const navigate = useNavigate();

    const { data: provinces = [], isLoading: isProvincesLoading } = useQuery({
        queryKey: ['provinces'],
        queryFn: () => taxonomyService.listProvinces(),
        staleTime: 5 * 60_000,
    });

    const provinceOptions = useMemo(() => [
        { value: '', label: 'Toàn quốc' },
        ...provinces.map((p: any) => ({
            value: String(p.id),
            label: p.province_name,
        })),
    ], [provinces]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (keyword) params.set('search', keyword);
        if (province) params.set('province_id', province);
        navigate(`/jobs?${params.toString()}`);
    };

    return (
        <section className="relative pt-20 md:pt-24 pb-14 md:pb-16 overflow-hidden" style={{
            background: 'linear-gradient(160deg, oklch(0.16 0.04 175) 0%, oklch(0.13 0.03 175) 40%, oklch(0.11 0.02 175) 100%)'
        }}>
            {/* === BACKGROUND LAYERS === */}

            {/* Noise texture */}
            <div className="absolute inset-0 noise-texture opacity-40 pointer-events-none" />

            {/* Warm teal glow — top left */}
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle at 40% 40%, oklch(0.45 0.14 175 / 0.25) 0%, transparent 65%)' }} />

            {/* Gold glow — right */}
            <div className="absolute top-16 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle at 60% 30%, oklch(0.65 0.12 85 / 0.15) 0%, transparent 65%)' }} />

            {/* Diagonal accent lines */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        oklch(0.65 0.14 175) 0px,
                        oklch(0.65 0.14 175) 1px,
                        transparent 1px,
                        transparent 32px
                    )`,
                }}
            />

            {/* Top accent — teal-gold gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-teal-light)] to-transparent opacity-40" />

            <div className="container mx-auto px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
                    className="max-w-5xl w-full mx-auto flex flex-col items-center text-center"
                >
                    {/* Eyebrow tag */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/[0.06] backdrop-blur-sm text-[var(--brand-teal-light)] text-[11px] font-bold uppercase tracking-[0.15em] mb-3 border border-white/[0.08]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-teal-light)] animate-pulse" />
                        Nền tảng tuyển dụng hàng đầu Việt Nam
                    </div>

                    <h1
                        className="text-[clamp(2.2rem,4.5vw,3.6rem)] font-extrabold tracking-tight leading-[1.15] text-white mb-3 text-center"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Tìm Việc Làm{' '}
                        <span className="brand-gradient-text">
                            Phù Hợp
                        </span>
                        {' '}Với Bạn
                    </h1>

                    <p className="text-sm md:text-base text-white/90 max-w-2xl mb-5 leading-relaxed font-normal text-center mx-auto">
                        Kết nối ứng viên tài năng với hàng nghìn doanh nghiệp hàng đầu.
                        Cơ hội nghề nghiệp được cập nhật mỗi ngày.
                    </p>

                    {/* Search bar — editorial dark glass */}
                    <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-2xl flex flex-col lg:flex-row gap-2 max-w-3xl w-full focus-within:border-teal-400/60 focus-within:ring-2 focus-within:ring-teal-400/20 transition-all mx-auto text-left">
                        <div className="flex items-center flex-[2] rounded-xl px-3.5 py-2 gap-2 bg-white/10 border border-white/15 focus-within:border-teal-400/60 transition-all">
                            <Search className="w-4 h-4 text-white shrink-0 stroke-[2.4] drop-shadow-sm" />
                            <input
                                type="text"
                                value={keyword}
                                onChange={e => setKeyword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Chức danh, kỹ năng, công ty..."
                                className="w-full bg-transparent border-none outline-none text-white font-semibold placeholder:text-white/80 text-sm"
                            />
                        </div>
                        <div className="flex items-center flex-1 rounded-xl px-3.5 py-2 gap-2 bg-white/10 border border-white/15 focus-within:border-teal-400/60 transition-all">
                            <MapPin className="w-4 h-4 text-white shrink-0 stroke-[2.4] drop-shadow-sm" />
                            <Combobox
                                value={province}
                                options={provinceOptions}
                                onChange={value => setProvince(String(value))}
                                placeholder={isProvincesLoading ? "Đang tải..." : "Toàn quốc"}
                                searchPlaceholder="Tìm tỉnh/thành phố..."
                                emptyMessage="Không tìm thấy tỉnh/thành phố."
                                disabled={isProvincesLoading}
                                className="h-auto w-full justify-between border-0 bg-transparent px-0 py-0 text-sm font-semibold text-white shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="lg:w-36 py-4.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-extrabold text-sm shadow-lg shadow-teal-500/25 transition-all"
                        >
                            Tìm Kiếm
                        </Button>
                    </div>

                    {/* CTAs */}
                    <div className="flex flex-wrap justify-center gap-3 mt-4">
                        <Link to="/jobs">
                            <Button
                                variant="outline"
                                className="rounded-full border-white/25 bg-white/10 backdrop-blur-md px-5 h-9 font-bold text-white hover:bg-white/20 hover:border-teal-400/60 hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 group text-xs tracking-wide active:scale-[0.97] cursor-pointer"
                            >
                                Tìm Việc Ngay
                                <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform duration-300 text-emerald-400" />
                            </Button>
                        </Link>
                        <Link to="/auth?mode=register">
                            <Button
                                className="rounded-full px-5 h-9 font-black bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-400/50 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 text-xs tracking-wide cursor-pointer"
                            >
                                Đăng Tin Miễn Phí
                            </Button>
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-2 md:gap-3 mt-5 text-[11px] font-medium text-white/80">
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/[0.06] backdrop-blur-sm border border-white/[0.08]">
                            <span className="text-[var(--brand-teal-light)] font-bold">✓</span> Miễn phí đăng ký
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/[0.06] backdrop-blur-sm border border-white/[0.08]">
                            <span className="text-[var(--brand-teal-light)] font-bold">✓</span> Cập nhật mỗi ngày
                        </span>
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/[0.06] backdrop-blur-sm border border-white/[0.08]">
                            <span className="text-[var(--brand-teal-light)] font-bold">✓</span> Bảo mật thông tin
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Wave divider bottom */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none">
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-16 block">
                    <path d="M0,40 C180,65 360,10 540,35 C720,58 900,8 1080,30 C1260,52 1350,20 1440,32 L1440,60 L0,60 Z" className="fill-background" />
                </svg>
            </div>
        </section>
    );

};

/* ─────────────────────────── STATS ─────────────────────────── */
const StatsSection = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['home-stats'],
        queryFn: async () => {
            const [jobs, companies] = await Promise.all([
                jobService.list({ page_size: 1 }),
                companyService.list({ page_size: 1 }),
            ]);
            return {
                total_jobs: jobs.data.count,
                total_companies: companies.data.count,
                total_users: jobs.data.count + companies.data.count,
            };
        },
        staleTime: 300_000,
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
            iconClass: "text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400",
        },
        {
            icon: Building,
            label: "Doanh Nghiệp",
            value: counters.companies,
            iconClass: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400",
        },
        {
            icon: Users,
            label: "Ứng Viên",
            value: counters.users,
            iconClass: "text-[var(--brand-gold-dark)] bg-[var(--brand-gold-light)]/30",
        },
    ];

    if (isLoading) return (
        <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
        </div>
    );

    return (
        <section id="stats-section" className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {items.map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -2 }}
                        transition={{ duration: 0.2 }}
                        className="editorial-card p-4 flex items-center gap-3.5"
                    >
                        <div className={`${stat.iconClass} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div
                                className="text-2xl font-bold text-foreground tracking-tight"
                                style={{ fontFamily: 'var(--font-display)' }}
                            >
                                {stat.value.toLocaleString('vi-VN')}<span className="text-primary text-lg">+</span>
                            </div>
                            <div className="text-xs font-semibold text-muted-foreground mt-0.5">{stat.label}</div>
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
        queryKey: ['featuredJobs', FEATURED_JOBS_LIMIT],
        queryFn: () => jobService.featured({ page_size: FEATURED_JOBS_LIMIT }).then(r => r.data)
    });
    const jobItems = unwrapList(jobs);

    return (
        <section className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
                <div className="editorial-line pt-3">
                    <h2
                        className="text-2xl font-bold text-foreground tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Việc Làm Nổi Bật
                    </h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Các cơ hội việc làm được tuyển chọn từ các doanh nghiệp hàng đầu</p>
                </div>
                <Link to="/jobs">
                    <Button variant="outline" className="rounded-full border-border font-bold text-xs text-foreground hover:border-primary hover:text-primary group transition-colors h-8 px-3.5">
                        Xem tất cả <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {isLoading
                    ? Array(FEATURED_JOBS_LIMIT).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
                    : jobItems.map((job: any) => <JobCard key={job.id} job={job} />)}
            </div>
        </section>
    );
};

const JobCard = ({ job }: { job: any }) => {
    const navigate = useNavigate();
    const companyTarget = job.company_slug ?? job.company?.slug ?? job.company_id ?? job.company?.id;

    return (
        <motion.div
            whileHover={{ y: -3, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.1)' }}
            transition={{ duration: 0.2 }}
            className="editorial-card p-3.5 flex flex-col gap-2.5 cursor-pointer group hover:border-primary/40 hover:bg-primary/[0.01] transition-all"
            onClick={() => navigate(`/jobs/${job.id}`)}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-lg bg-muted border border-border/60 flex items-center justify-center p-1.5 shrink-0">
                    <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-wrap justify-end items-center gap-1">
                    <Badge className="rounded-full px-2 py-0.5 bg-primary/10 text-primary border-none text-[10px] font-bold uppercase tracking-wide">
                        {job.job_type}
                    </Badge>
                    {job.is_remote && (
                        <Badge variant="outline" className="rounded-full px-2 py-0.5 border-teal-400/40 text-teal-600 text-[10px] font-bold uppercase">
                            Remote
                        </Badge>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-0.5">
                    {job.title}
                </h3>
                <button
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors truncate w-full text-left"
                    onClick={e => {
                        e.stopPropagation();
                        if (companyTarget) navigate(`/companies/${companyTarget}`);
                    }}
                >
                    <Building className="w-3 h-3 shrink-0" /> <span className="truncate">{job.company_name}</span>
                </button>
            </div>

            {/* Footer / Meta */}
            <div className="pt-2 border-t border-border/60 space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground/70 gap-2">
                    <div className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                        <span className="truncate">{job.locations}</span>
                    </div>
                    {job.deadline && (
                        <div className="flex items-center gap-1 shrink-0 text-[11px]">
                            <Clock className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                            <span>Hạn: {new Date(job.deadline).toLocaleDateString('vi-VN')}</span>
                        </div>
                    )}
                </div>
                <div>
                    {job.is_salary_visible ? (
                        <div className="flex items-center text-xs font-bold text-primary gap-1">
                            <DollarSign className="w-3 h-3 shrink-0" />
                            {job.salary_min?.toLocaleString('vi-VN')} – {job.salary_max?.toLocaleString('vi-VN')}
                            <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{job.salary_currency}</span>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground/60 italic font-medium">Thỏa thuận</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

/* ────────────────────────── CATEGORIES ────────────────────────── */
const JobCategoriesSection = () => {
    const navigate = useNavigate();
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: () => taxonomyService.listJobCategories()
    });

    const getCategoryIcon = (slug: string) => {
        const map: Record<string, any> = {
            'lap-trinh-web': Code,
            'tri-tue-nhan-tao': Bot,
            'quan-ly-du-an': Target,
            'thiet-ke-ui-ux': Palette,
            'kiem-thu-phan-mem': Bug,
        };
        const Icon = map[slug] || Briefcase;
        return <Icon className="w-6 h-6" />;
    };

    const categoryIconTones = [
        "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
        "bg-[var(--brand-gold-light)]/30 text-[var(--brand-gold-dark)]",
        "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
        "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    ];

    return (
        <section className="bg-muted/50 py-6 px-4">
            <div className="container mx-auto">
                <div className="text-center mb-4">
                    <h2
                        className="text-2xl font-bold text-foreground tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Danh Mục Nghề Nghiệp
                    </h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Khám phá cơ hội việc làm theo từng lĩnh vực</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {isLoading
                        ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
                        : categories?.map((cat: any, i: number) => (
                            <motion.div
                                key={cat.id}
                                whileHover={{ y: -3, scale: 1.01 }}
                                transition={{ duration: 0.18 }}
                                onClick={() => navigate(`/jobs?category_id=${cat.id}`)}
                                className="editorial-card p-3 flex flex-col items-center text-center gap-2 cursor-pointer group hover:border-primary/30 transition-all"
                            >
                                <div className={`w-9 h-9 rounded-lg ${categoryIconTones[i % categoryIconTones.length]} flex items-center justify-center`}>
                                    {getCategoryIcon(cat.slug)}
                                </div>
                                <div>
                                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">{cat.name}</div>
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
        queryFn: () => companyService.featured().then(r => r.data)
    });
    const companyItems = unwrapList(companies);
    const getJobCountLabel = (count?: number) => (
        count && count > 0 ? `${count} tin tuyển dụng` : 'Chưa có tin tuyển dụng'
    );

    return (
        <section className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-3">
                <div className="editorial-line pt-3">
                    <h2
                        className="text-2xl font-bold text-foreground tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                    >
                        Công Ty Nổi Bật
                    </h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Đối tác tuyển dụng uy tín từ khắp mọi lĩnh vực</p>
                </div>
                <Link to="/companies">
                    <Button variant="outline" className="rounded-full border-border font-bold text-xs text-foreground hover:border-primary hover:text-primary group transition-colors h-8 px-3.5">
                        Tất cả công ty <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {isLoading
                    ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
                    : companyItems.map((company: any) => (
                        <motion.div
                            key={company.id}
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.18 }}
                            className="editorial-card p-3.5 flex flex-col items-center text-center gap-2 cursor-pointer group hover:border-primary/30 hover:bg-primary/[0.01] transition-all"
                            onClick={() => navigate(`/companies/${company.id}`)}
                        >
                            <div className="w-12 h-12 rounded-xl bg-muted border border-border/60 flex items-center justify-center p-2 group-hover:shadow-sm transition-all">
                                <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-0.5 min-w-0 w-full">
                                <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors truncate">{company.company_name}</div>
                                {company.industry?.name && (
                                    <div className="text-[10px] text-primary font-semibold bg-primary/8 px-2 py-0.5 rounded-full inline-block truncate max-w-full">{company.industry.name}</div>
                                )}
                                <div className="text-[11px] text-muted-foreground">{getJobCountLabel(company.job_count)}</div>
                            </div>
                        </motion.div>
                    ))}
            </div>
        </section>
    );
};

/* ────────────────────────── INDUSTRIES ────────────────────────── */
const IndustriesSection = () => {
    const navigate = useNavigate();
    const { data: industries, isLoading } = useQuery({
        queryKey: ['industries'],
        queryFn: () => taxonomyService.listIndustries()
    });

    const getIcon = (name: string) => {
        const icons: any = { Monitor, Landmark, Home: HomeIcon, Factory, ShoppingBag, Headphones, Wifi };
        const Icon = icons[name] || Building;
        return <Icon className="w-5 h-5" />;
    };

    return (
        <section className="bg-muted/50 py-8 px-4">
            <div className="container mx-auto">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center">
                    <div className="lg:w-1/3 text-center lg:text-left">
                        <h2
                            className="text-2xl font-bold text-foreground tracking-tight mb-2"
                            style={{ fontFamily: 'var(--font-display)' }}
                        >
                            Lĩnh Vực Đa Dạng
                        </h2>
                        <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                            Khám phá đa dạng các mô hình công ty IT như Product, Outsourcing, Fintech, Edtech và AI/Blockchain.
                        </p>
                        <Link to="/companies">
                            <Button className="rounded-full px-4 h-8 text-xs bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-md shadow-teal-500/15 hover:brightness-110 transition-all">
                                Khám Phá Tất Cả
                            </Button>
                        </Link>
                    </div>

                    <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5 w-full">
                        {isLoading
                            ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
                            : industries?.map((ind: any) => (
                                <motion.div
                                    key={ind.id}
                                    whileHover={{ x: 3 }}
                                    transition={{ duration: 0.15 }}
                                    className="editorial-card flex items-center gap-3 px-3 py-2.5 !rounded-lg cursor-pointer group transition-all"
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Xem công ty thuộc lĩnh vực ${ind.name}`}
                                    onClick={() => navigate(`/companies?industry_id=${ind.id}`)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigate(`/companies?industry_id=${ind.id}`);
                                        }
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center text-primary group-hover:bg-primary/12 transition-all shrink-0">
                                        {getIcon(ind.icon_url)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-foreground text-xs leading-tight group-hover:text-primary transition-colors truncate">{ind.name}</div>
                                        <div className="text-[11px] text-muted-foreground">{ind.company_count} công ty</div>
                                    </div>
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary ml-auto shrink-0 transition-colors" />
                                </motion.div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
