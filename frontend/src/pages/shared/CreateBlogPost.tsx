import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Send, Save, ImageIcon, 
    BookOpen, Sparkles, ChevronLeft,
    CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { blogService } from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { BlogCategory } from '@/types/api';

export default function CreateBlogPost() {
    const navigate = useNavigate();
    const { slug } = useParams();
    const location = useLocation();
    const isEdit = !!slug;
    
    // Auth context (employer or candidate)
    const isEmployer = location.pathname.startsWith('/employer');
    const basePath = isEmployer ? '/employer/blog' : '/candidate/blog';

    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState<string>('');
    const [status, setStatus] = useState<string>('draft');
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');

    useEffect(() => {
        const loadMetadata = async () => {
            try {
                const catRes = await blogService.listCategories();
                setCategories(catRes.data.results);
                
                if (isEdit) {
                    const postRes = await blogService.getPost(slug!);
                    const post = postRes.data;
                    setTitle(post.title);
                    setSummary(post.summary || '');
                    setContent(post.content);
                    setCategoryId(post.category?.id.toString() || '');
                    setStatus(post.status);
                    if (post.thumbnail) setThumbnailPreview(post.thumbnail);
                }
            } catch (error) {
                toast.error('Lỗi khi tải thông tin');
            }
        };
        loadMetadata();
    }, [isEdit, slug]);

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !categoryId) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('summary', summary);
        formData.append('content', content);
        formData.append('category_id', categoryId);
        formData.append('status', status);
        if (thumbnail) {
            formData.append('thumbnail', thumbnail);
        }

        try {
            if (isEdit) {
                await blogService.updatePost(slug!, formData);
                toast.success('Cập nhật bài viết thành công');
            } else {
                await blogService.createPost(formData);
                toast.success('Đã tạo bài viết mới');
            }
            navigate(basePath);
        } catch (error: any) {
            toast.error('Có lỗi xảy ra khi lưu bài viết');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-[-20%] w-[60%] h-[500px] bg-gradient-to-l from-violet-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[100px] pointer-events-none rounded-full" />
            
            <div className="w-full mx-auto relative z-10 space-y-8 p-6 lg:p-8 animate-in fade-in duration-700">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 text-violet-600 mb-2">
                            <Sparkles size={18} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Sáng tạo nội dung</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            {isEdit ? 'Chỉnh sửa' : 'Viết'} <span className="text-violet-600">bài viết</span> mới
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(basePath)}
                            className="rounded-2xl h-12 px-6 font-bold text-slate-500 hover:bg-slate-100 gap-2 transition-all"
                        >
                            <ChevronLeft size={18} /> Quay lại
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-2xl px-10 h-12 font-black shadow-lg shadow-violet-500/25 transition-all gap-2 group relative overflow-hidden shrink-0"
                        >
                            <span className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
                            {isLoading ? (
                                <div className="relative flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Đang lưu...
                                </div>
                            ) : (
                                <div className="relative flex items-center gap-2">
                                    {isEdit ? 'Lưu thay đổi' : 'Đăng bài viết'} <Send className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                </div>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Content Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden"
                        >
                            <div className="p-8 md:p-10 space-y-10">
                                
                                {/* Title Input */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Tiêu đề bài viết <span className="text-red-500">*</span></Label>
                                    <Input 
                                        placeholder="VD: Bí quyết vượt qua vòng phỏng vấn kỹ thuật..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="h-16 text-xl md:text-2xl font-black rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 transition-all px-6 placeholder:text-slate-300"
                                        required
                                    />
                                </div>

                                {/* Summary */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Tóm tắt ngắn gọn</Label>
                                    <Textarea 
                                        placeholder="Một vài dòng mô tả ngắn giúp người đọc nắm bắt nhanh nội dung..."
                                        value={summary}
                                        onChange={(e) => setSummary(e.target.value)}
                                        className="min-h-[100px] rounded-2xl border-slate-200 focus:border-violet-500 focus:ring-violet-500/10 transition-all font-bold text-slate-700 p-5 resize-none placeholder:text-slate-300"
                                    />
                                </div>

                                {/* Content Editor Simulator */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-wider">Nội dung chi tiết <span className="text-red-500">*</span></Label>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-slate-50/30 rounded-2xl border-2 border-dashed border-slate-200 -z-10 group-focus-within:border-violet-200 group-focus-within:bg-violet-50/10 transition-all"></div>
                                        <Textarea 
                                            placeholder="Bắt đầu chia sẻ câu chuyện của bạn tại đây..."
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="min-h-[400px] rounded-2xl border-none bg-transparent focus:ring-0 transition-all font-medium text-slate-700 p-6 leading-relaxed text-base md:text-lg"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Sidebar Options */}
                    <div className="space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8 space-y-8"
                        >
                            <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Thiết lập bài viết
                            </h3>

                            {/* Category Select */}
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Lĩnh vực <span className="text-red-500">*</span></Label>
                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger className="h-12 rounded-xl border-slate-200 font-bold bg-slate-50/50">
                                        <SelectValue placeholder="Chọn chuyên mục" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-200 p-2 shadow-xl">
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id.toString()} className="rounded-xl font-bold py-2.5">
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Toggle */}
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Trạng thái đăng bài</Label>
                                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setStatus('draft')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                            status === 'draft' 
                                            ? 'bg-white shadow-sm text-slate-900 border border-slate-200' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <Clock className="w-3.5 h-3.5" /> Bản nháp
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStatus('published')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                            status === 'published' 
                                            ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white' 
                                            : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Công khai
                                    </button>
                                </div>
                            </div>

                            {/* Thumbnail Upload */}
                            <div className="space-y-4 pt-2">
                                <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Ảnh đại diện bài viết</Label>
                                <div 
                                    className="relative aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 overflow-hidden cursor-pointer hover:border-violet-300 hover:bg-violet-50/30 transition-all group"
                                    onClick={() => document.getElementById('thumbnail')?.click()}
                                >
                                    {thumbnailPreview ? (
                                        <>
                                            <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20">Thay đổi ảnh</Badge>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 rounded-2xl bg-white text-slate-400 shadow-sm group-hover:text-violet-600 group-hover:scale-110 transition-all">
                                                <ImageIcon className="w-6 h-6" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tải ảnh lên (16:9)</p>
                                        </>
                                    )}
                                </div>
                                <input id="thumbnail" type="file" accept="image/*" className="hidden" onChange={handleThumbnailChange} />
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <div className="p-5 rounded-2xl bg-violet-50/50 border border-violet-100/50 space-y-3">
                                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5" /> Lưu ý bài viết
                                    </p>
                                    <p className="text-xs text-violet-900/70 font-bold leading-relaxed">
                                        Mọi bài viết công khai cần tuân thủ quy tắc cộng đồng của JOBIO. Bài viết vi phạm sẽ bị gỡ bỏ không báo trước.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                        
                        <div className="px-6 py-4 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-white text-indigo-500 flex items-center justify-center shadow-sm shrink-0">
                                <Save className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Tự động sao lưu</p>
                                <p className="text-[11px] text-indigo-400 font-bold truncate">Nội dung sẽ được tự động lưu sau mỗi {30} giây</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom navigation bar (Sticky inspired) */}
                <footer className="pt-10 pb-20 text-center">
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em]">
                        &copy; 2026 JOBIO Blog Creator Platform
                    </p>
                </footer>
            </div>
        </div>
    );
}
