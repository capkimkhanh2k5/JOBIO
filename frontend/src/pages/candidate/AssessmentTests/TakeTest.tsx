import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentService } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Clock, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TakeTest() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const testId = Number(id);

    const [hasStarted, setHasStarted] = useState(false);
    const [answers, setAnswers] = useState<Record<number, any>>({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const { data: test, isLoading: isTestLoading } = useQuery({
        queryKey: ['assessmentTest', testId],
        queryFn: () => assessmentService.getTest(testId),
        enabled: !!testId,
    });

    const { data: questions, isLoading: isQuestionsLoading } = useQuery({
        queryKey: ['assessmentQuestions', testId],
        queryFn: () => assessmentService.getQuestions(testId),
        enabled: hasStarted, // only fetch when started
    });

    const startMutation = useMutation({
        mutationFn: () => assessmentService.startTest(testId),
        onSuccess: () => {
            setHasStarted(true);
            if (test?.duration_minutes) {
                setTimeLeft(test.duration_minutes * 60);
            }
        },
        onError: (error: any) => {
            toast.error(error.message || 'Lỗi khi bắt đầu bài test.');
        },
    });

    const submitMutation = useMutation({
        mutationFn: () => assessmentService.submitTest(testId, answers),
        onSuccess: (result) => {
            toast.success('Nộp bài thành công!');
            navigate(`/assessment-tests/${result.id}/result`, { replace: true });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Lỗi khi nộp bài.');
        },
    });

    useEffect(() => {
        if (timeLeft === null || !hasStarted) return;

        if (timeLeft <= 0) {
            toast.warning('Đã hết thời gian làm bài. Đang tự động nộp bài...');
            submitMutation.mutate();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, hasStarted]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (questionId: number, value: any) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    if (isTestLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (!test) {
        return <div className="text-center py-20">Bài test không tồn tại.</div>;
    }

    if (!hasStarted) {
        return (
            <div className="p-6 lg:p-8 w-full flex-1 pb-16">
                <Card className="shadow-lg border-primary/20">
                    <CardHeader className="text-center pb-8 border-b bg-muted/20">
                        <CardTitle className="text-2xl mb-2">{test.title}</CardTitle>
                        <div className="flex justify-center gap-6 text-muted-foreground mt-4">
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {test.duration_minutes} phút</span>
                            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {test.total_questions} câu hỏi</span>
                            <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Điểm lọt: {test.passing_score}%</span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <p className="mb-4 text-center">
                            Bạn sắp bắt đầu bài kiểm tra năng lực. Vui lòng đảm bảo kết nối mạng ổn định và không thoát khỏi trang trong quá trình làm bài.
                        </p>
                        <ul className="text-sm space-y-2 mb-8 bg-muted/40 p-4 rounded-lg">
                            <li>• Bài làm sẽ tự động được nộp khi hết thời gian.</li>
                            <li>• Bạn có thể xem lại và thay đổi câu trả lời trước khi nộp bài.</li>
                            <li>• Số lần làm lại tối đa: {test.max_retakes} lần.</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="flex justify-center pb-8">
                        <Button
                            size="lg"
                            className="w-full max-w-sm"
                            onClick={() => startMutation.mutate()}
                            disabled={startMutation.isPending}
                        >
                            {startMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Bắt đầu làm bài ngay
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (isQuestionsLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    const q = questions?.[currentQuestionIndex];

    return (
        <div className="p-6 lg:p-8 w-full flex-1 pb-8">
            <div className="flex flex-col md:flex-row gap-6">

                {/* Main Content */}
                <div className="flex-1 max-w-3xl">
                    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border mb-6">
                        <h2 className="text-lg font-semibold">{test.title}</h2>
                        <div className="flex items-center gap-2 text-primary font-medium bg-primary/10 px-4 py-2 rounded-full">
                            <Clock className="w-5 h-5" />
                            <span className="text-lg tabular-nums">{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
                        </div>
                    </div>

                    {q ? (
                        <Card className="mb-6 shadow-sm border border-border">
                            <CardHeader className="bg-muted/10 border-b">
                                <CardTitle className="text-lg font-medium leading-relaxed">
                                    <span className="text-muted-foreground mr-2 font-normal">Câu {currentQuestionIndex + 1}/{questions?.length}:</span>
                                    {q.question_data.text as string}
                                </CardTitle>
                                <div className="text-sm text-muted-foreground mt-2">{q.points} điểm</div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {q.question_type === 'multiple_choice' && (
                                    <div className="space-y-4">
                                        {(q.question_data.options as string[] || []).map((opt, idx) => (
                                            <div key={idx} className="flex items-center space-x-3 bg-muted/20 p-4 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => handleAnswerChange(q.id, opt)}>
                                                <input
                                                    type="radio"
                                                    name={`q${q.id}`}
                                                    id={`q${q.id}-opt${idx}`}
                                                    value={opt}
                                                    checked={answers[q.id] === opt}
                                                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                    className="w-4 h-4 text-primary focus:ring-primary border-muted-foreground"
                                                />
                                                <Label htmlFor={`q${q.id}-opt${idx}`} className="flex-grow cursor-pointer text-base font-normal">
                                                    {opt}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {q.question_type === 'text_input' && (
                                    <Textarea
                                        placeholder="Nhập câu trả lời của bạn..."
                                        className="min-h-[150px] text-base"
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                    />
                                )}

                                {q.question_type === 'code_editor' && (
                                    <div className="relative">
                                        <p className="text-sm text-muted-foreground mb-4">Viết code vào ô bên dưới:</p>
                                        <Textarea
                                            placeholder="// Your code here..."
                                            className="min-h-[300px] font-mono text-sm bg-slate-950 text-slate-50"
                                            value={answers[q.id] || ''}
                                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                            spellCheck={false}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="text-center py-20 border rounded-lg bg-card">Không có dữ liệu câu hỏi.</div>
                    )}

                    <div className="flex justify-between items-center mb-10">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Câu trước
                        </Button>

                        {currentQuestionIndex === (questions?.length || 1) - 1 ? (
                            <Button
                                onClick={() => submitMutation.mutate()}
                                disabled={submitMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {submitMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Nộp bài
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min((questions?.length || 1) - 1, prev + 1))}
                            >
                                Câu tiếp theo
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="bg-white p-4 rounded-lg shadow-sm border sticky top-24">
                        <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">
                            Danh sách câu hỏi
                        </h3>
                        <div className="grid grid-cols-5 gap-2">
                            {questions?.map((qItem, idx) => {
                                const isAnswered = !!answers[qItem.id];
                                const isCurrent = idx === currentQuestionIndex;

                                return (
                                    <button
                                        key={qItem.id}
                                        onClick={() => setCurrentQuestionIndex(idx)}
                                        className={`
                      w-10 h-10 rounded-md flex items-center justify-center text-sm font-medium transition-colors border
                      ${isCurrent ? 'ring-2 ring-primary ring-offset-1 border-primary bg-primary text-primary-foreground' : ''}
                      ${!isCurrent && isAnswered ? 'bg-primary/10 border-primary/30 text-primary' : ''}
                      ${!isCurrent && !isAnswered ? 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/60' : ''}
                    `}
                                    >
                                        {idx + 1}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="mt-8 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Đã trả lời:</span>
                                <span className="font-medium text-primary">{Object.keys(answers).length}/{questions?.length || 0}</span>
                            </div>
                            <Button
                                variant="default"
                                className="w-full mt-4"
                                onClick={() => submitMutation.mutate()}
                                disabled={submitMutation.isPending}
                            >
                                {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Nộp bài ngay
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
