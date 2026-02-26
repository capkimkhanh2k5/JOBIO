import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Building2, Heart, Image as ImageIcon, Loader2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Components
import { CompanyInfoForm } from '@/components/employer/company-profile/CompanyInfoForm';
import { BenefitsManagement } from '@/components/employer/company-profile/BenefitsManagement';
import { MediaGalleryManagement } from '@/components/employer/company-profile/MediaGalleryManagement';
import { VerificationSection } from '@/components/employer/company-profile/VerificationSection';

export default function CompanyProfile() {
    // Current route in our setup doesn't pass company id from params for employer dashboard. 
    // Usually it's tied to current user session, so we fetch their associated company.
    const { data: company, isLoading, isError } = useQuery({
        queryKey: ['employerCompany'],
        queryFn: () => apiClient.getEmployerCompany(),
    });

    const { data: industries } = useQuery({
        queryKey: ['industries'],
        queryFn: () => apiClient.getIndustries(),
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                <p className="text-muted-foreground animate-pulse">Đang tải hồ sơ công ty...</p>
            </div>
        );
    }

    if (isError || !company) {
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        Hồ sơ công ty
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Quản lý thông tin, hình ảnh và văn hóa công ty để thu hút ứng viên.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-muted-foreground mb-1">Mức độ hoàn thiện</span>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-500 w-[85%] rounded-full" />
                            </div>
                            <span className="text-sm font-semibold text-emerald-500">85%</span>
                        </div>
                    </div>
                </div>
            </div>

            <VerificationSection company={company} />

            {/* Main Content Tabs */}
            <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full justify-start border-b border-slate-200 dark:border-slate-800 rounded-none h-auto p-0 bg-transparent flex-wrap gap-6 mb-6">
                    <TabsTrigger
                        value="info"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 py-3 bg-transparent text-muted-foreground data-[state=active]:text-foreground"
                    >
                        <Building2 className="w-4 h-4 mr-2" />
                        Thông tin chung
                    </TabsTrigger>
                    <TabsTrigger
                        value="benefits"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 py-3 bg-transparent text-muted-foreground data-[state=active]:text-foreground"
                    >
                        <Heart className="w-4 h-4 mr-2" />
                        Phúc lợi & Chế độ
                    </TabsTrigger>
                    <TabsTrigger
                        value="media"
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 rounded-none px-2 py-3 bg-transparent text-muted-foreground data-[state=active]:text-foreground"
                    >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Thư viện Media
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="info" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <CompanyInfoForm company={company} industries={industries || []} />
                    </TabsContent>

                    <TabsContent value="benefits" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <BenefitsManagement companyId={company.id} />
                    </TabsContent>

                    <TabsContent value="media" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <MediaGalleryManagement companyId={company.id} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
