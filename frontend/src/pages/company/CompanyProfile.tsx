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
                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                <p className="text-muted-foreground animate-pulse">Đang tải hồ sơ công ty...</p>
            </div>
        );
    }

    const is404 = (error as any)?.response?.status === 404;

    if (is404 || !company) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="p-4 rounded-full bg-teal-500/10 text-teal-500 mb-2">
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
        <div className="w-full mx-auto">
            {/* Page Header */}
            <div>
                <PageHeader
                    title="Hồ sơ công ty"
                    description="Quản lý thông tin, hình ảnh và văn hóa doanh nghiệp để thu hút ứng viên chất lượng."
                    icon={Building2}
                    action={
                        <div className="flex items-center gap-3 bg-card/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-border/60 shadow-sm">
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Mức độ hoàn thiện</span>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-28 h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 w-[85%] rounded-full shadow-sm" />
                                    </div>
                                    <span className="text-xs font-black text-teal-600 dark:text-teal-400">85%</span>
                                </div>
                            </div>
                        </div>
                    }
                />
            </div>

            <div className="px-5 lg:px-8 pb-8 pt-5 space-y-6">
                <VerificationSection company={company} />

                {/* Main Content Tabs */}
                <Tabs defaultValue="info" className="w-full">
                    <div className="inline-flex rounded-2xl bg-muted/60 p-1.5 border border-border/50 shadow-inner">
                        <TabsList className="flex items-center gap-1.5 bg-transparent h-auto p-0">
                            <TabsTrigger
                                value="info"
                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md cursor-pointer"
                            >
                                <Building2 className="w-4 h-4 text-teal-600" />
                                Thông tin chung
                            </TabsTrigger>
                            <TabsTrigger
                                value="benefits"
                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md cursor-pointer"
                            >
                                <Heart className="w-4 h-4 text-pink-500" />
                                Phúc lợi & Chế độ
                            </TabsTrigger>
                            <TabsTrigger
                                value="media"
                                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-muted-foreground transition-all data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-md cursor-pointer"
                            >
                                <ImageIcon className="w-4 h-4 text-cyan-500" />
                                Thư viện Media
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="mt-5">
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
