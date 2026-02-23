import { motion } from 'framer-motion';
import {
    Globe,
    ExternalLink,
    CheckCircle2,
    Users,
    Building,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CompanySidebarProps {
    company: {
        id: string;
        company_name: string;
        industry_name: string;
        logo_url: string;
        company_size: string;
        founded_year: string;
        website_url: string;
        verification_status: string;
        follower_count: number;
        job_count: number;
    };
}

export const CompanySidebar = ({ company }: CompanySidebarProps) => {
    const handleFollow = () => {
        toast.success(`Đã theo dõi ${company.company_name}`);
    };

    return (
        <aside className="flex flex-col gap-6">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card-tinted rounded-[32px] p-8 border-white/20 sticky top-24 relative overflow-hidden"
            >
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-xl glass p-2 border border-white/20">
                        <img src={company.logo_url} alt={company.company_name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg flex items-center gap-1 group">
                            {company.company_name}
                            {company.verification_status === 'verified' && (
                                <CheckCircle2 size={16} className="text-blue-500 fill-blue-500/10" />
                            )}
                        </h4>
                        <p className="text-sm text-muted-foreground">{company.industry_name}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Quy mô</p>
                        <p className="text-sm font-black">{company.company_size}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-widest">Thành lập</p>
                        <p className="text-sm font-black">{company.founded_year}</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Users size={16} />
                            Người theo dõi
                        </span>
                        <span className="font-bold text-foreground">{(company.follower_count / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Building size={16} />
                            Tin đang tuyển
                        </span>
                        <span className="font-bold text-foreground">{company.job_count}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground group">
                        <Globe size={16} />
                        <a
                            href={company.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 truncate"
                        >
                            Website công ty
                            <ExternalLink size={12} />
                        </a>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="outline"
                        className="w-full glass border-primary/20 hover:bg-primary/10 text-primary hover:text-primary font-bold rounded-xl h-11 transition-all"
                        onClick={handleFollow}
                    >
                        Theo dõi công ty
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl group"
                    >
                        Xem tất cả tin tuyển dụng
                        <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </motion.div>
        </aside>
    );
};
