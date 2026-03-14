import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock, Trophy, RefreshCcw, ArrowLeft, Download } from 'lucide-react';

export default function TestResult() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const resultId = Number(id);

    const { data: result, isLoading } = useQuery({
        queryKey: ['assessmentResult', resultId],
        queryFn: () => assessmentService.getTestResult(resultId),
        enabled: !!resultId,
    });

    if (isLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!result) {
        return <div className="text-center py-20">Không tìm thấy kết quả.</div>;
    }

    const { assessment_test: test } = result;

    return (
        <div className="p-6 lg:p-8 w-full flex-1 pb-12">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate('/assessment-tests')} className="text-muted-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>

            <Card className="shadow-lg border-primary/10">
                <CardHeader className="text-center pb-8 border-b bg-muted/10 relative overflow-hidden">
                    {/* Decorative background circle */}
                    <div className="absolute top-0 left-1/2 -mt-20 -ml-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />

                    <Badge variant="outline" className="mx-auto mb-4 bg-background">
                        {test.test_type}
                    </Badge>
                    <CardTitle className="text-3xl mb-4 font-bold">{test.title}</CardTitle>

                    <div className="flex items-center justify-center mb-6">
                        {result.passed ? (
                            <div className="flex flex-col items-center text-green-600 animate-in zoom-in duration-500">
                                <CheckCircle2 className="w-20 h-20 mb-2" />
                                <h3 className="text-2xl font-bold">ĐẠT (PASSED)</h3>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-red-500 animate-in zoom-in duration-500">
                                <XCircle className="w-20 h-20 mb-2" />
                                <h3 className="text-2xl font-bold">CHƯA ĐẠT (FAILED)</h3>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pt-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-muted/30 p-4 rounded-xl text-center border">
                            <div className="text-muted-foreground text-sm mb-1 flex items-center justify-center gap-1">
                                <Trophy className="w-4 h-4" /> Điểm số
                            </div>
                            <div className="text-2xl font-bold">
                                <span className={result.passed ? 'text-green-600' : 'text-red-500'}>{result.percentage_score}%</span>
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl text-center border">
                            <div className="text-muted-foreground text-sm mb-1">Điểm yc</div>
                            <div className="text-2xl font-bold text-foreground">
                                {test.passing_score}%
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl text-center border">
                            <div className="text-muted-foreground text-sm mb-1 flex items-center justify-center gap-1">
                                <Clock className="w-4 h-4" /> Thời gian
                            </div>
                            <div className="text-2xl font-bold text-foreground">
                                {result.time_taken_minutes}p
                            </div>
                        </div>
                        <div className="bg-muted/30 p-4 rounded-xl text-center border">
                            <div className="text-muted-foreground text-sm mb-1">Độ khó</div>
                            <div className="text-xl font-bold text-foreground capitalize mt-1">
                                {test.difficulty_level}
                            </div>
                        </div>
                    </div>

                    <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                        <h4 className="font-semibold mb-2">Thông tin chứng nhận</h4>
                        <p className="text-sm text-muted-foreground">
                            {result.passed
                                ? 'Chúc mừng bạn đã vượt qua bài đánh giá! Kết quả này sẽ được hiển thị trên hồ sơ của bạn và giúp bạn nổi bật hơn trong mắt nhà tuyển dụng.'
                                : 'Rất tiếc, kết quả của bạn chưa đạt yêu cầu. Bạn có thể trau dồi thêm và thử lại sau khi thời gian chờ kết thúc.'}
                        </p>
                        {result.certificate_url && (
                            <Button
                                className="mt-4 bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                                onClick={() => window.open(result.certificate_url as string, '_blank')}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Tải chứng chỉ
                            </Button>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="flex gap-4 justify-center pb-8 border-t pt-8 bg-muted/5">
                    <Button variant="outline" onClick={() => navigate(`/assessment-tests`)} className="px-8">
                        Trở về danh mục
                    </Button>
                    <Button onClick={() => navigate(`/assessment-tests/${test.id}/take`)} className="px-8 gap-2">
                        <RefreshCcw className="w-4 h-4" />
                        Làm lại bài test
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
