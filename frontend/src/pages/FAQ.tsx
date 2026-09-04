import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, HelpCircle, ChevronDown, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/* ─── Mock Data ─── */
const FAQ_CATEGORIES = [
    { id: 'general', label: 'Chung' },
    { id: 'candidate', label: 'Dành cho Ứng viên' },
    { id: 'company', label: 'Dành cho Nhà tuyển dụng' },
];

const FAQS = [
    {
        id: 'q1',
        category: 'general',
        q: 'JOBIO là gì?',
        a: 'JOBIO là nền tảng tuyển dụng thế hệ mới, ứng dụng AI để kết nối giữa ứng viên và nhà tuyển dụng một cách thông minh, nhanh chóng và chính xác nhất tại Việt Nam.'
    },
    {
        id: 'q2',
        category: 'general',
        q: 'Làm thế nào để liên hệ với bộ phận hỗ trợ?',
        a: 'Bạn có thể liên hệ với chúng tôi qua trang Liên hệ, qua email support@jobio.vn, hoặc số điện thoại hotline 1800 456 789 trong giờ hành chính.'
    },
    {
        id: 'q3',
        category: 'candidate',
        q: 'Có mất phí khi tạo hồ sơ và ứng tuyển trên trang JOBIO không?',
        a: 'Việc tạo hồ sơ, tìm kiếm việc làm và ứng tuyển trên JOBIO hoàn toàn MIỄN PHÍ cho mọi ứng viên. Tuy nhiên chúng tôi có cung cấp gói Premium để hồ sơ của bạn nổi bật hơn.'
    },
    {
        id: 'q4',
        category: 'candidate',
        q: 'Làm thế nào để hồ sơ của tôi được chú ý?',
        a: 'Hãy điền đầy đủ thông tin: Kinh nghiệm làm việc, Kỹ năng, Học vấn. Hệ thống AI Matching của chúng tôi sẽ tự động phân tích và đề xuất hồ sơ của bạn cho các nhà tuyển dụng phù hợp nhất.'
    },
    {
        id: 'q5',
        category: 'company',
        q: 'Tôi muốn đăng tin tuyển dụng thì làm thế nào?',
        a: 'Ban có thể đăng ký tài khoản Nhà tuyển dụng, sau đó chọn Gói dịch vụ phù hợp trong trang Bảng giá. Gói Free cho phép bạn đăng tối đa 3 tin tuyển dụng miễn phí.'
    },
    {
        id: 'q6',
        category: 'company',
        q: 'Tính năng AI Matching hoạt động như thế nào?',
        a: 'AI của chúng tôi sẽ phân tích mô tả công việc (JD) của bạn, sau đó quét qua hàng ngàn CV trên hệ thống để tìm ra các ứng viên có kỹ năng và kinh nghiệm khớp nhất, giúp bạn tiết kiệm 60% thời gian lọc CV.'
    },
];

/* ─── Helpers ─── */
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
            {children}
        </motion.div>
    );
}

function FaqItem({ item }: { item: typeof FAQS[0] }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={cn('bg-card rounded-2xl border overflow-hidden transition-all shadow-sm', open ? 'border-primary/20 ring-1 ring-primary/8' : 'border-border hover:border-primary/12')}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left group"
                aria-expanded={open}
            >
                <span className="font-semibold text-sm pr-4 text-foreground group-hover:text-primary transition-colors">{item.q}</span>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors', open ? 'bg-primary/8' : 'bg-muted group-hover:bg-primary/8/50')}>
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground/60 transition-transform duration-300', open && 'rotate-180 text-primary')} />
                </div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="px-5 pb-5 pt-2 text-sm text-muted-foreground leading-relaxed border-t border-border/60 bg-muted/30">
                            {item.a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Main Component ─── */
export default function FAQ() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('general');

    const filteredFaqs = useMemo(() => {
        let result = FAQS;
        if (activeTab !== 'all') {
            result = result.filter(q => q.category === activeTab);
        }
        if (searchTerm.trim() !== '') {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(q => q.q.toLowerCase().includes(lowerQuery) || q.a.toLowerCase().includes(lowerQuery));
        }
        return result;
    }, [searchTerm, activeTab]);

    return (
        <div className="relative min-h-screen pb-20 bg-muted/30">
            {/* ── Hero ── */}
            <section className="relative pt-28 pb-12 px-4 text-center overflow-hidden">
                <FadeIn>
                    <Badge className="mb-4 bg-primary/8 border-primary/12 text-primary hover:bg-primary/12 px-4 py-1.5">
                        <HelpCircle className="w-3.5 h-3.5 mr-1.5 inline" />
                        Trung tâm hỗ trợ
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-foreground">
                        Chúng tôi có thể giúp gì cho bạn?
                    </h1>
                </FadeIn>
                <FadeIn delay={0.2}>
                    <div className="max-w-xl mx-auto relative mt-8">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-muted-foreground/60" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm câu hỏi (vd: thanh toán, hồ sơ...)"
                            className="w-full bg-card rounded-2xl py-4 pl-12 pr-4 border border-border outline-none focus:border-primary/80 focus:ring-2 focus:ring-primary/80/20 transition-all text-sm placeholder:text-muted-foreground/60 shadow-sm"
                        />
                    </div>
                </FadeIn>

                <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/80/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-1/4 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* ── FAQ Content ── */}
            <section className="px-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">

                    {/* Sidebar / Tabs */}
                    <FadeIn delay={0.3} className="md:w-64 shrink-0">
                        <div className="bg-card rounded-2xl p-4 border border-border sticky top-24 shadow-sm">
                            <h3 className="font-bold text-foreground text-sm mb-4 px-3">Danh mục</h3>
                            <nav className="flex flex-col gap-1.5">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={cn(
                                        'px-4 py-2.5 rounded-xl text-left text-sm transition-all flex items-center justify-between font-medium',
                                        activeTab === 'all' ? 'bg-primary/8 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    Tất cả câu hỏi
                                    <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-semibold", activeTab === 'all' ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")}>{FAQS.length}</span>
                                </button>
                                {FAQ_CATEGORIES.map(cat => {
                                    const count = FAQS.filter(q => q.category === cat.id).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveTab(cat.id)}
                                            className={cn(
                                                'px-4 py-2.5 rounded-xl text-left text-sm transition-all flex items-center justify-between font-medium',
                                                activeTab === cat.id ? 'bg-primary/8 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                            )}
                                        >
                                            {cat.label}
                                            <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-semibold", activeTab === cat.id ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")}>{count}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </FadeIn>

                    {/* FAQ List */}
                    <div className="flex-1 space-y-4">
                        {filteredFaqs.length === 0 ? (
                            <FadeIn>
                                <div className="text-center py-16 bg-card rounded-3xl border border-border shadow-sm">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-muted-foreground/60" />
                                    </div>
                                    <h3 className="font-bold text-foreground text-lg mb-2">Không tìm thấy kết quả</h3>
                                    <p className="text-sm text-muted-foreground">Vui lòng thử lại với từ khóa khác hoặc liên hệ bộ phận hỗ trợ.</p>
                                </div>
                            </FadeIn>
                        ) : (
                            filteredFaqs.map((faq, idx) => (
                                <FadeIn key={faq.id} delay={0.05 * Math.min(idx, 5)}>
                                    <FaqItem item={faq} />
                                </FadeIn>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ── Contact Support CTA ── */}
            <section className="px-4 mt-20">
                <div className="max-w-4xl mx-auto">
                    <FadeIn>
                        <div className="bg-primary/8 rounded-3xl p-8 md:p-10 border border-primary/12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-card/40 blur-3xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-foreground mb-3 flex items-center justify-center md:justify-start gap-2.5">
                                    <div className="p-2 bg-primary/12 rounded-lg">
                                        <MessageCircle className="w-5 h-5 text-primary" />
                                    </div>
                                    Không tìm thấy câu trả lời?
                                </h3>
                                <p className="text-muted-foreground max-w-md mx-auto md:mx-0 font-medium">
                                    Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.
                                </p>
                            </div>
                            <Button asChild size="lg" className="bg-primary text-white border-0 hover:bg-primary/90 shadow-sm relative z-10 font-semibold w-full md:w-auto">
                                <Link to="/contact">
                                    Liên hệ hỗ trợ ngay
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}
