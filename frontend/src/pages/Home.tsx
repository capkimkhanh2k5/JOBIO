import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, MapPin, Briefcase, Building, Users, Laptop, Megaphone, PenTool, PieChart, Stethoscope, GraduationCap, Monitor, Landmark, Home as HomeIcon, Factory, ShoppingBag, Headphones, ArrowRight, Zap, DollarSign } from "lucide-react";
import { apiClient } from "../services/apiClient";
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
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: section,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }, []);

    return (
        <div ref={mainRef} className="w-full flex flex-col gap-40 pb-32">
            <HeroSection />
            <div className="reveal-section"><StatsSection /></div>
            <div className="reveal-section"><FeaturedJobsSection /></div>
            <div className="reveal-section"><JobCategoriesSection /></div>
            <div className="reveal-section"><FeaturedCompaniesSection /></div>
            <div className="reveal-section"><IndustriesSection /></div>
        </div>
    );
}

const HeroSection = () => {
    const { data: provinces } = useQuery({
        queryKey: ['provinces'],
        queryFn: apiClient.getProvinces,
    });

    return (
        <section className="relative pt-44 pb-32 overflow-hidden flex items-center justify-center min-h-[90vh]">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-50 pointer-events-none">
                <div className="absolute top-[5%] left-0 w-[600px] h-[600px] bg-cyan-400/30 rounded-full blur-[120px] aurora-orb" />
                <div className="absolute bottom-[10%] right-0 w-[700px] h-[700px] bg-violet-500/30 rounded-full blur-[130px] aurora-orb" style={{ animationDelay: '2s', animationDuration: '15s' }} />
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                    className="max-w-5xl mx-auto space-y-12"
                >
                    <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full glass-effect text-primary text-sm font-bold tracking-widest uppercase shadow-sm">
                        <Zap className="w-4 h-4 fill-primary" />
                        <span>Pioneering Recruitment Experience</span>
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.9] text-foreground drop-shadow-[0_20px_40px_rgba(0,0,0,0.05)]">
                        Elevate <br className="hidden md:block" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 via-violet-600 to-lime-600 animate-gradient filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]">Your Career</span>
                    </h1>
                    <p className="text-xl md:text-3xl text-muted-foreground/90 max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-sm">
                        Connect with global leaders and craft your professional destiny with an advanced, AI-driven recruitment ecosystem.
                    </p>

                    {/* Premium Search Bar */}
                    <div className="glass-effect p-4 rounded-[40px] flex flex-col lg:flex-row gap-4 mt-16 max-w-6xl mx-auto shadow-2xl border-[oklch(1_0_0/20%)]">
                        <div className="flex-[2] flex items-center bg-background/50 backdrop-blur-md rounded-[28px] px-8 py-5 border border-border/50 group focus-within:border-primary/50 transition-all shadow-inner">
                            <Search className="w-6 h-6 text-muted-foreground mr-4 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Role, company, or skills..."
                                className="w-full bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/50 text-xl font-medium"
                            />
                        </div>
                        <div className="flex-1 flex items-center bg-background/50 backdrop-blur-md rounded-[28px] px-8 py-5 border border-border/50 group focus-within:border-primary/50 transition-all shadow-inner">
                            <MapPin className="w-6 h-6 text-muted-foreground mr-4 group-focus-within:text-primary transition-colors" />
                            <select className="w-full bg-transparent border-none outline-none appearance-none text-foreground text-xl font-medium cursor-pointer">
                                <option value="">Global Locations</option>
                                {provinces?.map((p: string) => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <Button size="lg" className="lg:w-64 h-full py-6 rounded-[28px] bg-primary hover:bg-primary/90 text-white font-black text-xl shadow-xl shadow-primary/30 magnetic-button">
                            Search Jobs
                        </Button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-10 pt-10">
                        <Link to="/jobs">
                            <Button variant="ghost" className="text-xl font-bold rounded-full group px-8 h-14 magnetic-button">
                                Explore Openings <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                            </Button>
                        </Link>
                        <Link to="/employer/register">
                            <Button variant="outline" className="text-xl font-bold rounded-full glass-effect border-[oklch(1_0_0/10%)] hover:bg-[oklch(1_0_0/15%)] px-8 h-14 magnetic-button">
                                For Employers
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const StatsSection = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats'], queryFn: apiClient.getStats
    });

    const [counters, setCounters] = useState({ jobs: 0, companies: 0, users: 0 });

    useEffect(() => {
        if (stats) {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: "#stats-section",
                    start: "top 80%",
                }
            });

            tl.to(counters, {
                jobs: stats.total_jobs,
                companies: stats.total_companies,
                users: stats.total_users,
                duration: 2.5,
                roundProps: "jobs,companies,users",
                onUpdate: () => setCounters({ ...counters }),
                ease: "expo.out"
            });
        }
    }, [stats]);

    if (isLoading) return <div className="container mx-auto px-4"><Skeleton className="h-48 rounded-3xl w-full" /></div>;

    return (
        <section id="stats-section" className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                    { icon: Briefcase, label: "Live Vacancies", value: counters.jobs, color: "from-cyan-400 to-blue-600" },
                    { icon: Building, label: "Trusted Partners", value: counters.companies, color: "from-violet-400 to-fuchsia-600" },
                    { icon: Users, label: "Success Stories", value: counters.users, color: "from-lime-400 to-emerald-600" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -15, scale: 1.02 }}
                        className="glass-effect p-12 rounded-[48px] flex flex-col items-center text-center gap-8 relative group overflow-hidden border-[oklch(1_0_0/10%)]"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-700`} />
                        <div className={`p-6 bg-gradient-to-br ${stat.color} rounded-3xl text-white shadow-2xl`}>
                            <stat.icon className="w-12 h-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="text-5xl md:text-6xl font-black mb-2 tracking-tighter">{stat.value.toLocaleString()}<span className="text-primary">+</span></div>
                            <div className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-[11px]">{stat.label}</div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

const FeaturedJobsSection = () => {
    const { data: jobs, isLoading } = useQuery({
        queryKey: ['featuredJobs'], queryFn: apiClient.getFeaturedJobs
    });

    return (
        <section className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-8 text-center md:text-left">
                <div className="max-w-2xl">
                    <h2 className="text-5xl font-black mb-6 tracking-tight">Handpicked Opportunities</h2>
                    <p className="text-xl text-muted-foreground font-medium">Elevate your path with roles from disruptive startups to industry titans.</p>
                </div>
                <Link to="/jobs">
                    <Button variant="outline" className="rounded-full glass-effect group px-8 h-14 text-lg font-bold border-[oklch(1_0_0/10%)] magnetic-button">
                        View All Openings <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                {isLoading
                    ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-[320px] rounded-[32px] glass-effect" />)
                    : jobs?.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
        </section>
    );
};

const JobCard = ({ job }: { job: any }) => {
    const navigate = useNavigate();

    const handleCardClick = () => {
        navigate(`/jobs/${job.id}`);
    };

    return (
        <motion.div
            whileHover={{ y: -8 }}
            transition={{ duration: 0.2, ease: [0.1, 0.9, 0.2, 1] }}
            className="glass-effect p-8 rounded-[40px] flex flex-col gap-6 cursor-pointer group border-[oklch(1_0_0/10%)] hover:border-primary/40 transition-all duration-300 shadow-xl hover:shadow-2xl relative overflow-hidden"
            onClick={handleCardClick}
        >
            <div className="flex items-start justify-between relative z-10 transition-transform duration-300 group-hover:-translate-y-1">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center p-3 shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <img src={job.logo_url} alt={job.company_name} className="w-full h-full object-contain" />
                </div>
                <div className="flex flex-col items-end gap-3">
                    <Badge className="rounded-full px-4 py-1.5 bg-primary/10 text-primary border-none font-black uppercase text-[10px] tracking-widest shadow-sm">
                        {job.job_type}
                    </Badge>
                    {job.is_remote && (
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 glass-effect border-cyan-500/30 text-cyan-600 dark:text-cyan-400 font-black uppercase text-[10px] tracking-widest shadow-sm">
                            Remote
                        </Badge>
                    )}
                </div>
            </div>

            <div className="space-y-4 relative z-10 transition-transform duration-300 group-hover:-translate-y-2">
                <h3 className="font-black text-2xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {job.title}
                </h3>
                <div className="flex items-center text-[15px] font-bold text-muted-foreground/80 cursor-pointer hover:underline" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/companies/${job.id}`);
                }}>
                    <Building className="w-5 h-5 mr-2 text-primary/40" /> {job.company_name}
                </div>
            </div>

            <div className="mt-auto pt-6 border-t border-border/30 flex flex-col gap-4 relative z-10 transition-transform duration-300 group-hover:-translate-y-2">
                <div className="flex items-center text-[14px] font-bold text-muted-foreground/60">
                    <MapPin className="w-5 h-5 mr-2 text-primary/30" /> {job.locations}
                </div>
                <div className="flex justify-between items-center">
                    {job.is_salary_visible ? (
                        <div className="flex items-center text-primary font-black text-xl">
                            <DollarSign className="w-5 h-5 mr-1 text-primary/60" />
                            {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}
                            <span className="text-[11px] ml-2 opacity-50 uppercase tracking-tighter">{job.salary_currency}</span>
                        </div>
                    ) : (
                        <div className="text-muted-foreground/60 text-base italic font-medium">Salary Negotiable</div>
                    )}
                </div>
            </div>

            {/* Premium Hover Interaction */}
            <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                <Button
                    className="w-full h-12 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 h-14"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick();
                    }}
                >
                    Apply Now
                </Button>
            </div>
        </motion.div>
    );
};

const FeaturedCompaniesSection = () => {
    const { data: companies, isLoading } = useQuery({
        queryKey: ['featuredCompanies'], queryFn: apiClient.getFeaturedCompanies
    });

    return (
        <section className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center mb-20 gap-8 text-center md:text-left">
                <div>
                    <h2 className="text-5xl font-black mb-6 tracking-tight">World-Class Employers</h2>
                    <p className="text-xl text-muted-foreground font-medium">Direct partnerships with the most influential organizations globally.</p>
                </div>
                <Link to="/companies">
                    <Button variant="link" className="text-primary group text-xl font-black magnetic-button">
                        All Organizations <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                    </Button>
                </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-12">
                {isLoading
                    ? Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-[48px]" />)
                    : companies?.map(company => (
                        <motion.div
                            key={company.id}
                            whileHover={{ y: -10 }}
                            transition={{ duration: 0.2, ease: [0.1, 0.9, 0.2, 1] }}
                            className="glass-effect p-10 rounded-[48px] flex flex-col items-center text-center gap-6 relative overflow-hidden group cursor-pointer border-[oklch(1_0_0/5%)] shadow-xl transition-all duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-5 shadow-2xl mb-2 relative z-10 group-hover:scale-105 transition-transform duration-300">
                                <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                            </div>

                            <div className="relative z-10 space-y-3 transition-transform duration-300 group-hover:-translate-y-2">
                                <div>
                                    <div className="font-black text-2xl mb-1 group-hover:text-primary transition-colors tracking-tighter">{company.company_name}</div>
                                    <div className="text-xs font-black text-primary/80 bg-primary/10 px-4 py-1.5 rounded-full uppercase tracking-widest">{company.industry_name}</div>
                                </div>
                                <div className="text-[15px] font-bold text-muted-foreground/70">
                                    <span className="text-primary text-xl">{company.job_count}</span> Open Roles
                                </div>
                            </div>

                            {/* Clean Bottom Reveal Button */}
                            <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                <Button className="w-full h-12 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20">
                                    View Vacancies
                                </Button>
                            </div>
                        </motion.div>
                    ))}
            </div>
        </section>
    );
};

const JobCategoriesSection = () => {
    const { data: categories, isLoading } = useQuery({
        queryKey: ['categories'], queryFn: apiClient.getCategories
    });

    const getIcon = (name: string) => {
        const icons: any = { Laptop, Megaphone, PenTool, PieChart, Stethoscope, GraduationCap };
        const Icon = icons[name] || Briefcase;
        return <Icon className="w-10 h-10" />;
    };

    return (
        <section className="container mx-auto px-4 overflow-hidden relative">
            <div className="text-center mb-24">
                <h2 className="text-6xl font-black mb-6 uppercase tracking-tight">Curated Categories</h2>
                <p className="text-xl text-muted-foreground font-medium">Discover your niche within high-growth sectors.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10">
                {isLoading
                    ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56 rounded-[56px] glass-effect" />)
                    : categories?.map((cat) => (
                        <motion.div
                            key={cat.id}
                            whileHover={{ y: -10, scale: 1.02 }}
                            transition={{ duration: 0.2, ease: [0.1, 0.9, 0.2, 1] }}
                            className="glass-effect p-12 rounded-[56px] flex flex-col items-center text-center gap-8 cursor-pointer group hover:bg-primary transition-all duration-300 shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-6 bg-primary/10 rounded-3xl text-primary group-hover:bg-white group-hover:text-primary transition-all duration-500 shadow-xl">
                                {getIcon(cat.icon_url)}
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-2xl group-hover:text-white transition-colors tracking-tighter">{cat.name}</h3>
                                <div className="text-[11px] font-black text-muted-foreground group-hover:text-white/70 transition-colors uppercase tracking-[0.3em]">{cat.job_count} Roles</div>
                            </div>
                        </motion.div>
                    ))}
            </div>
        </section>
    );
};

const IndustriesSection = () => {
    const { data: industries, isLoading } = useQuery({
        queryKey: ['industries'], queryFn: apiClient.getIndustries
    });

    const getIcon = (name: string) => {
        const icons: any = { Monitor, Landmark, Home: HomeIcon, Factory, ShoppingBag, Headphones };
        const Icon = icons[name] || Building;
        return <Icon className="w-8 h-8" />;
    };

    return (
        <section className="container mx-auto px-4 pb-20">
            <div className="glass-effect p-20 rounded-[80px] relative overflow-hidden shadow-2xl border-[oklch(1_0_0/10%)]">
                <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="relative z-10 flex flex-col xl:flex-row gap-24 items-center">
                    <div className="xl:w-1/3 text-center xl:text-left">
                        <h2 className="text-6xl font-black mb-8 leading-[1.1] tracking-tighter">Diverse <br className="hidden xl:block" /> <span className="text-primary italic">Verticals</span></h2>
                        <p className="text-muted-foreground text-xl mb-12 leading-relaxed font-medium">Access over 30+ sectors from bleeding-edge quantum computing to legacy financial systems.</p>
                        <Button className="rounded-full px-12 py-8 h-auto font-black text-2xl shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 magnetic-button">Explore All Verticals</Button>
                    </div>
                    <div className="xl:w-2/3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                        {isLoading
                            ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl glass-effect" />)
                            : industries?.map((ind, i) => (
                                <motion.div
                                    key={ind.id}
                                    whileHover={{ x: 5, scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
                                    transition={{ duration: 0.2, ease: [0.1, 0.9, 0.2, 1] }}
                                    className="flex items-center gap-6 p-8 rounded-[32px] border border-border/40 hover:border-primary/40 transition-all duration-300 cursor-pointer bg-white/5 shadow-lg group"
                                >
                                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500 border border-primary/10">
                                        {getIcon(ind.icon_url)}
                                    </div>
                                    <div>
                                        <div className="font-black text-xl leading-tight mb-2 tracking-tighter group-hover:text-primary transition-colors">{ind.name}</div>
                                        <div className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">{ind.company_count} Companies</div>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
