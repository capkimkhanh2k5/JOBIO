import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '@/services/assessmentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2, Clock, CheckCircle2, Search, ArrowRight, Activity, BookOpen, Brain, Code2, Globe } from 'lucide-react';

export default function TestCatalogue() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

    const { data: categories } = useQuery({
        queryKey: ['assessmentCategories'],
        queryFn: assessmentService.getCategories,
    });

    const { data: testsData, isLoading } = useQuery({
        queryKey: ['assessmentTests', { categoryFilter, typeFilter, difficultyFilter }],
        queryFn: () => assessmentService.getTests({
            category_id: categoryFilter !== 'all' ? Number(categoryFilter) : undefined,
            test_type: typeFilter !== 'all' ? typeFilter : undefined,
            difficulty_level: difficultyFilter !== 'all' ? difficultyFilter : undefined,
        }),
    });

    const tests = testsData?.results || [];

    // Filter locally by search term
    const filteredTests = tests.filter(test =>
        test.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDifficultyBadge = (level: string) => {
        switch (level) {
            case 'beginner': return <Badge variant="secondary" className="bg-green-100 text-green-800">Beginner</Badge>;
            case 'intermediate': return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Intermediate</Badge>;
            case 'advanced': return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Advanced</Badge>;
            case 'expert': return <Badge variant="secondary" className="bg-red-100 text-red-800">Expert</Badge>;
            default: return null;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'skill': return <CheckCircle2 className="w-4 h-4" />;
            case 'personality': return <Activity className="w-4 h-4" />;
            case 'aptitude': return <Brain className="w-4 h-4" />;
            case 'language': return <Globe className="w-4 h-4" />;
            case 'technical': return <Code2 className="w-4 h-4" />;
            default: return <BookOpen className="w-4 h-4" />;
        }
    };

    const handleStartTest = async (testId: number) => {
        // Navigate straight to take page; TakeTest handles session initialization and retake checks
        navigate(`/assessment-tests/${testId}/take`);
    };

    return (
        <div className="container mx-auto px-4 max-w-7xl pb-16 pt-40">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Trung tâm Đánh giá Năng lực</h1>
                <p className="text-muted-foreground">
                    Thực hiện các bài kiểm tra kỹ năng để làm nổi bật hồ sơ của bạn với nhà tuyển dụng.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* Filters */}
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Search className="w-5 h-5 text-primary" />
                            Bộ lọc
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tìm kiếm</label>
                            <Input
                                placeholder="Tên bài kiểm tra..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Danh mục</label>
                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                                    {categories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={String(cat.id)}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Loại bài test</label>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả các loại" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả các loại</SelectItem>
                                    <SelectItem value="skill">Kỹ năng mềm/Chuyên môn</SelectItem>
                                    <SelectItem value="personality">Tính cách (Personality)</SelectItem>
                                    <SelectItem value="aptitude">Tư duy (Aptitude)</SelectItem>
                                    <SelectItem value="language">Ngôn ngữ</SelectItem>
                                    <SelectItem value="technical">Kỹ thuật (Code/Tech)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Độ khó</label>
                            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Mọi độ khó" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Mọi độ khó</SelectItem>
                                    <SelectItem value="beginner">Mới bắt đầu</SelectItem>
                                    <SelectItem value="intermediate">Trung bình</SelectItem>
                                    <SelectItem value="advanced">Nâng cao</SelectItem>
                                    <SelectItem value="expert">Chuyên gia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(categoryFilter !== 'all' || typeFilter !== 'all' || difficultyFilter !== 'all' || searchTerm !== '') && (
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                onClick={() => {
                                    setCategoryFilter('all');
                                    setTypeFilter('all');
                                    setDifficultyFilter('all');
                                    setSearchTerm('');
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                </div>

                {/* Test List */}
                <div className="md:col-span-3">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredTests.length === 0 ? (
                        <div className="text-center py-20 bg-muted/30 rounded-lg border border-dashed">
                            <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground">Không tìm thấy bài test nào</h3>
                            <p className="text-muted-foreground mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredTests.map((test) => (
                                <Card key={test.id} className="flex flex-col hover:border-primary/50 transition-colors h-full">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-4 mb-2">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex gap-2 items-center flex-wrap">
                                                    {getDifficultyBadge(test.difficulty_level)}
                                                    {test.category && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {test.category.name}
                                                        </Badge>
                                                    )}
                                                    <Badge variant="outline" className="text-xs capitalize flex items-center gap-1">
                                                        {getTypeIcon(test.test_type)}
                                                        {test.test_type}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-xl line-clamp-2 leading-tight">
                                                    {test.title}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-4">
                                        <div className="flex gap-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <span>{test.duration_minutes} phút</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                                <span>{test.total_questions} câu hỏi</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <Activity className="w-4 h-4 text-primary" />
                                                <span>Pass: {test.passing_score}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="pt-4 border-t bg-muted/10">
                                        <Button
                                            className="w-full gap-2"
                                            onClick={() => handleStartTest(test.id)}
                                        >
                                            Bắt đầu làm bài
                                            <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
