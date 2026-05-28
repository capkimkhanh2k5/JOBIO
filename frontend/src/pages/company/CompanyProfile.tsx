import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import { taxonomyService } from '@/services/taxonomyService';
import { Building2, Heart, Image as ImageIcon, Loader2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';

// Components
import { CompanyInfoForm } from '@/components/company/company-profile/CompanyInfoForm';
import { BenefitsManagement } from '@/components/company/company-profile/BenefitsManagement';
import { MediaGalleryManagement } from '@/components/company/company-profile/MediaGalleryManagement';
import { VerificationSection } from '@/components/company/company-profile/VerificationSection';

export default function CompanyProfile() {
    // Current route in our setup doesn't pass company id from params for company dashboard. 
    // Usually it's tied to current user session, so we fetch their associated company.
    const { data: company, isLoading, error } = useQuery({
        queryKey: ['companyProfile'],
        queryFn: () => companyService.getMyCompany().then(r => r.data),
        retry: (failureCount, err: any) => err?.response?.status === 404 ? false : failureCount < 2,
    });

    const { data: industries = [] } = useQuery({
        queryKey: ['industries'],
        queryFn: () => taxonomyService.listIndustries({ is_active: true }),
        staleTime: 10 * 60_000,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-muted-foreground animate-pulse">Đang tải hồ sơ công ty...</p>
            </div>
        );
    }

    const is404 = (error as any)?.response?.status === 404;

    if (is404 || !company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-500 mb-2">
                    <Building2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold">Bạn chưa có hồ sơ công ty</h2>
                <p className="text-muted-foreground">Tạo hồ sơ công ty để bắt đầu đăng tin tuyển dụng và thu hút ứng viên.</p>
                <a
                    href="mailto:support@jobnow.vn"
                    className="mt-2 px-6 py-2.5 rounded-xl bg-cyan-600 text-white font-semibold hover:bg-cyan-700 transition-colors"
                >
                    Liên hệ để tạo công ty
                </a>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="p-4 rounded-full bg-red-500/10 text-red-500 mb-2">
                    <Info className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-semibold">Không thể tải thông tin công ty</h2>
                <p className="text-muted-foreground">Vui lòng thử lại sau</p>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto min-h-screen">
            {/* Page Header */}
            <div className="sticky top-0 z-20">
                <PageHeader
                    title="Hồ sơ công ty"
                    description="Quản lý thông tin, hình ảnh và văn hóa doanh nghiệp để thu hút ứng viên chất lượng."
                    icon={Building2}
                    action={
                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-white/40 shadow-sm">
                            <div className="flex flex-col items-start px-2">
                                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1.5">Mức độ hoàn thiện</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 h-2.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-600 w-[85%] rounded-full shadow-[0_0_8px_rgba(139,92,246,0.4)]" />
                                    </div>
                                    <span className="text-sm font-black text-violet-600">85%</span>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>

            <div className="px-6 lg:px-8 pb-6 lg:pb-8 pt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <VerificationSection company={company} />

                {/* Main Content Tabs */}
                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="w-full justify-start border-b border-slate-200 rounded-none h-auto p-0 bg-transparent flex-wrap gap-8 mb-8">
                        <TabsTrigger
                            value="info"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-1 py-4 bg-transparent text-slate-500 font-bold text-sm data-[state=active]:text-slate-900 transition-all hover:text-slate-800"
                        >
                            <Building2 className="w-4 h-4 mr-2" />
                            Thông tin chung
                        </TabsTrigger>
                        <TabsTrigger
                            value="benefits"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-1 py-4 bg-transparent text-slate-500 font-bold text-sm data-[state=active]:text-slate-900 transition-all hover:text-slate-800"
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            Phúc lợi & Chế độ
                        </TabsTrigger>
                        <TabsTrigger
                            value="media"
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-1 py-4 bg-transparent text-slate-500 font-bold text-sm data-[state=active]:text-slate-900 transition-all hover:text-slate-800"
                        >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Thư viện Media
                        </TabsTrigger>
                    </TabsList>

                    <div className="mt-6">
                        <TabsContent value="info" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                            <CompanyInfoForm company={company} industries={industries} />
                        </TabsContent>

                        <TabsContent value="benefits" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                            <BenefitsManagement companyId={String(company.id)} />
                        </TabsContent>

                        <TabsContent value="media" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                            <MediaGalleryManagement companyId={String(company.id)} />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}
