import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export default function MyTests() {
    const { data: myResultsData, isLoading } = useQuery({
        queryKey: ['myTestResults'],
        queryFn: () => assessmentService.getMyTestResults(),
    });

    const results = myResultsData?.results || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-card-foreground">Kết quả Đánh giá</h2>
                    <p className="text-muted-foreground mt-1">Lịch sử và chứng chỉ các bài kiểm tra năng lực của bạn.</p>
                </div>
                <Button asChild>
                    <Link to="/assessment-tests">Khám phá bài test mới</Link>
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                    <h3 className="text-lg font-medium text-foreground mb-2">Bạn chưa làm bài test nào</h3>
                    <p className="text-muted-foreground mb-6">Làm bài test để nhà tuyển dụng đánh giá cao hồ sơ của bạn hơn.</p>
                    <Button asChild>
                        <Link to="/assessment-tests">Đến Trung tâm Đánh giá</Link>
                    </Button>
                </div>
            ) : (
                <div className="bg-card border rounded-lg overflow-hidden whitespace-nowrap overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Tên bài test</th>
                                <th className="px-6 py-4 font-medium">Loại</th>
                                <th className="px-6 py-4 font-medium">Ngày hoàn thành</th>
                                <th className="px-6 py-4 font-medium">Điểm số</th>
                                <th className="px-6 py-4 font-medium">Kết quả</th>
                                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {results.map((result) => (
                                <tr key={result.id} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-6 py-4 font-medium text-foreground">
                                        {result.assessment_test.title}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize">{result.assessment_test.test_type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {format(new Date(result.completed_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        <span className={result.passed ? "text-green-600" : "text-red-500"}>
                                            {result.percentage_score}%
                                        </span>
                                        <span className="text-muted-foreground text-xs ml-1">
                                            (ĐYC: {result.assessment_test.passing_score}%)
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {result.passed ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Đạt
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                                                <XCircle className="w-3 h-3 mr-1" /> Chưa đạt
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link to={`/assessment-tests/${result.id}/result`}>
                                                Chi tiết <ArrowRight className="w-3 h-3 ml-1" />
                                            </Link>
                                        </Button>
                                        {result.certificate_url && (
                                            <Button variant="default" size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => window.open(result.certificate_url as string, '_blank')}>
                                                <Download className="w-3 h-3 mr-1" /> Chứng chỉ
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
