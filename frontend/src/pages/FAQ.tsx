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
    { id: 'employer', label: 'Dành cho Nhà tuyển dụng' },
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
        a: 'Bạn có thể liên hệ với chúng tôi qua trang Liên hệ, qua email support@jobio.vn, hoặc số điện thoại hotline 1800 599 984 trong giờ hành chính.'
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
        category: 'employer',
        q: 'Tôi muốn đăng tin tuyển dụng thì làm thế nào?',
        a: 'Ban có thể đăng ký tài khoản Nhà tuyển dụng, sau đó chọn Gói dịch vụ phù hợp trong trang Bảng giá. Gói Free cho phép bạn đăng tối đa 3 tin tuyển dụng miễn phí.'
    },
    {
        id: 'q6',
        category: 'employer',
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
        <div className={cn('glass-card-tinted rounded-2xl border overflow-hidden transition-colors', open ? 'border-violet-400/30' : 'border-white/10')}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-5 text-left group"
                aria-expanded={open}
            >
                <span className="font-medium text-sm pr-4 group-hover:text-violet-400 transition-colors">{item.q}</span>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors', open ? 'bg-violet-500/20' : 'bg-white/5')}>
                    <ChevronDown className={cn('w-3.5 h-3.5 text-foreground/50 transition-transform duration-300', open && 'rotate-180 text-violet-400')} />
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
                        <div className="px-5 pb-5 pt-2 text-sm text-foreground/60 leading-relaxed border-t border-white/5">
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
        <div className="relative min-h-screen pb-20">
            {/* ── Hero ── */}
            <section className="relative pt-28 pb-12 px-4 text-center overflow-hidden">
                <FadeIn>
                    <Badge className="mb-4 glass-effect border-pink-400/30 text-pink-400 px-4 py-1.5">
                        <HelpCircle className="w-3.5 h-3.5 mr-1.5 inline" />
                        Trung tâm hỗ trợ
                    </Badge>
                </FadeIn>
                <FadeIn delay={0.1}>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-100 to-violet-200">
                        Chúng tôi có thể giúp gì cho bạn?
                    </h1>
                </FadeIn>
                <FadeIn delay={0.2}>
                    <div className="max-w-xl mx-auto relative mt-8">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-foreground/40" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm câu hỏi (vd: thanh toán, hồ sơ...)"
                            className="w-full glass-card-tinted rounded-2xl py-4 pl-12 pr-4 border border-white/10 outline-none focus:border-violet-400/50 transition-colors text-sm placeholder:text-foreground/40"
                        />
                    </div>
                </FadeIn>

                <div className="absolute top-20 left-1/4 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-16 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            </section>

            {/* ── FAQ Content ── */}
            <section className="px-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8">

                    {/* Sidebar / Tabs */}
                    <FadeIn delay={0.3} className="md:w-64 shrink-0">
                        <div className="glass-card-tinted rounded-2xl p-4 border border-white/10 sticky top-24">
                            <h3 className="font-semibold text-sm mb-4 px-3">Danh mục</h3>
                            <nav className="flex flex-col gap-1">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={cn(
                                        'px-4 py-2.5 rounded-xl text-left text-sm transition-all flex items-center justify-between',
                                        activeTab === 'all' ? 'bg-violet-500/15 text-violet-400 font-medium' : 'text-foreground/60 hover:bg-white/5 hover:text-foreground/80'
                                    )}
                                >
                                    Tất cả câu hỏi
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5">{FAQS.length}</span>
                                </button>
                                {FAQ_CATEGORIES.map(cat => {
                                    const count = FAQS.filter(q => q.category === cat.id).length;
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveTab(cat.id)}
                                            className={cn(
                                                'px-4 py-2.5 rounded-xl text-left text-sm transition-all flex items-center justify-between',
                                                activeTab === cat.id ? 'bg-violet-500/15 text-violet-400 font-medium' : 'text-foreground/60 hover:bg-white/5 hover:text-foreground/80'
                                            )}
                                        >
                                            {cat.label}
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5">{count}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </FadeIn>

                    {/* FAQ List */}
                    <div className="flex-1 space-y-3">
                        {filteredFaqs.length === 0 ? (
                            <FadeIn>
                                <div className="text-center py-12 glass-card-tinted rounded-3xl border border-white/10">
                                    <Search className="w-10 h-10 text-foreground/20 mx-auto mb-4" />
                                    <h3 className="font-semibold text-lg mb-2">Không tìm thấy kết quả</h3>
                                    <p className="text-sm text-foreground/50">Vui lòng thử lại với từ khóa khác hoặc liên hệ bộ phận hỗ trợ.</p>
                                </div>
                            </FadeIn>
                        ) : (
                            filteredFaqs.map((faq, idx) => (
                                <FadeIn key={faq.id} delay={0.1 * Math.min(idx, 5)}>
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
                        <div className="glass-card-tinted rounded-3xl p-8 border border-white/10 bg-gradient-to-br from-violet-500/10 to-pink-500/10 text-center flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="text-left">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-violet-400" />
                                    Không tìm thấy câu trả lời?
                                </h3>
                                <p className="text-sm text-foreground/60 max-w-md">
                                    Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp mọi thắc mắc của bạn 24/7.
                                </p>
                            </div>
                            <Button asChild className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0 hover:from-violet-400 hover:to-pink-400 magnetic-button shrink-0">
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
