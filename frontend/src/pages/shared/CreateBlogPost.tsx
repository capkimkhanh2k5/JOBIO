import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ImageIcon,
  Loader2,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { blogService } from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { BlogCategory } from '@/types/api';

function extractApiErrorMessage(responseData: unknown): string | null {
  if (!responseData) return null;
  if (typeof responseData === 'string') return responseData;

  if (Array.isArray(responseData)) {
    const firstMessage = responseData.find((item): item is string => typeof item === 'string');
    return firstMessage ?? null;
  }

  if (typeof responseData === 'object') {
    for (const value of Object.values(responseData)) {
      const nested = extractApiErrorMessage(value);
      if (nested) return nested;
    }
  }

  return null;
}

export default function CreateBlogPost() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const isEdit = Boolean(slug);
  const isCompany = location.pathname.startsWith('/company');
  const basePath = user?.role === 'admin' 
    ? '/admin/blog' 
    : (isCompany ? '/company/blog' : '/blog');

  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('draft');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const catRes = await blogService.listCategories();
        const categoryData = Array.isArray(catRes.data)
          ? catRes.data
          : Array.isArray((catRes.data as { results?: BlogCategory[] })?.results)
            ? (catRes.data as { results: BlogCategory[] }).results
            : [];

        setCategories(categoryData);

        if (isEdit && slug) {
          const postRes = await blogService.getPost(slug);
          const post = postRes.data;

          setTitle(post.title);
          setSummary(post.summary || '');
          setContent(post.content);
          setCategoryId(post.category?.id?.toString() || '');
          setStatus(post.status);

          if (post.thumbnail) {
            setThumbnailPreview(post.thumbnail);
            setThumbnailUrl(post.thumbnail);
          }
        }
      } catch {
        toast.error('Lỗi khi tải thông tin bài viết');
      }
    };

    void loadMetadata();
  }, [isEdit, slug]);

  const attachThumbnailToPost = async (postSlug: string, file: File) => {
    const res = await blogService.uploadThumbnail(postSlug, file);
    setThumbnailUrl(res.data.thumbnail_url);
    setThumbnailPreview(res.data.thumbnail_url);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
    setIsUploadingThumbnail(true);

    try {
      const res = await blogService.uploadImage(file);
      setThumbnailUrl(res.data.file_path);
      setThumbnailPreview(res.data.file_path);
      toast.success('Upload thành công');
    } catch {
      setThumbnail(null);
      setThumbnailUrl('');
      setThumbnailPreview('');
      toast.error('Không thể tải ảnh đại diện lên Cloudinary');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !content || !categoryId) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (thumbnail && !thumbnailUrl) {
      toast.error('Ảnh đại diện đang tải lên hoặc chưa upload thành công');
      return;
    }

    setIsLoading(true);

    const payload = {
      title,
      summary,
      content,
      category_id: Number(categoryId),
      status: status as 'draft' | 'published' | 'archived',
    };

    try {
      let targetSlug = slug;

      if (isEdit && slug) {
        const response = await blogService.updatePost(slug, payload);
        targetSlug = response.data.slug;
        toast.success('Cập nhật bài viết thành công');
      } else {
        const response = await blogService.createPost(payload);
        targetSlug = response.data.slug;
        toast.success('Đã tạo bài viết mới');
      }

      if (thumbnail && targetSlug) {
        try {
          await attachThumbnailToPost(targetSlug, thumbnail);
        } catch {
          toast.warning('Bài viết đã được lưu, nhưng ảnh đại diện chưa gắn được.');
        }
      }

      navigate(basePath);
    } catch (error: any) {
      const responseData = error?.response?.data;
      console.error('Blog save failed:', responseData || error);
      const detail = extractApiErrorMessage(responseData);
      toast.error(detail || 'Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute right-[-20%] top-0 h-[500px] w-[60%] rounded-full bg-gradient-to-l from-violet-500/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] h-[400px] w-[50%] rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[100px]" />

      <div className="relative z-10 mx-auto w-full space-y-8 p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex flex-col">
            <div className="mb-2 flex items-center gap-3 text-violet-600">
              <Sparkles size={18} className="animate-pulse" />
              <span className="text-xs font-bold tracking-wide">Sáng tạo nội dung</span>
            </div>
            <h1 className="text-[2.15rem] font-bold leading-tight tracking-[-0.03em] text-slate-900 md:text-[2.65rem]">
              {isEdit ? 'Chỉnh sửa' : 'Viết'} <span className="text-violet-600">bài viết</span> mới
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(basePath)}
              className="h-12 rounded-2xl px-6 font-bold text-slate-500 transition-all hover:bg-slate-100"
            >
              <ChevronLeft size={18} /> Quay lại
            </Button>
            <Button
              onClick={handleSavePost}
              disabled={isLoading}
              className="relative h-12 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-10 font-black text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-700 hover:to-indigo-700"
            >
              <span className="absolute inset-0 translate-y-full bg-white/10 transition-transform duration-300 group-hover:translate-y-0" />
              {isLoading ? (
                <span className="relative flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Đang lưu...
                </span>
              ) : (
                <span className="relative flex items-center gap-2">
                  {isEdit ? 'Lưu thay đổi' : 'Đăng bài viết'} <Send className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/40"
            >
              <div className="space-y-10 p-8 md:p-10">
                <div className="space-y-3">
                  <Label className="ml-1 text-sm font-bold tracking-[0.01em] text-slate-700">
                    Tiêu đề bài viết <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="VD: Bí quyết vượt qua vòng phỏng vấn kỹ thuật..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-16 rounded-2xl border-slate-200 px-6 text-[1.65rem] font-semibold tracking-[-0.025em] text-slate-900 placeholder:font-medium placeholder:text-slate-300 focus:border-violet-500 focus:ring-violet-500/10"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="ml-1 text-sm font-bold tracking-[0.01em] text-slate-700">Tóm tắt ngắn gọn</Label>
                  <Textarea
                    placeholder="Một vài dòng mô tả ngắn giúp người đọc nắm bắt nhanh nội dung..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="min-h-[100px] resize-none rounded-2xl border-slate-200 p-5 text-[15px] font-normal leading-7 text-slate-700 placeholder:font-normal placeholder:text-slate-300 focus:border-violet-500 focus:ring-violet-500/10"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="ml-1 text-sm font-bold tracking-[0.01em] text-slate-700">
                    Nội dung chi tiết <span className="text-red-500">*</span>
                  </Label>
                  <div className="group relative">
                    <div className="absolute inset-0 -z-10 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/30 transition-all group-focus-within:border-violet-200 group-focus-within:bg-violet-50/10" />
                    <Textarea
                      placeholder="Bắt đầu chia sẻ câu chuyện của bạn tại đây..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[400px] rounded-2xl border-none bg-transparent p-6 text-[16px] font-normal leading-8 tracking-[0.005em] text-slate-700 placeholder:text-slate-300 focus:ring-0"
                      required
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:p-6"
            >
              <h3 className="flex items-center gap-2 px-1 text-sm font-bold tracking-[0.04em] text-violet-600">
                <BookOpen className="h-4 w-4" /> Thiết lập bài viết
              </h3>

              <div className="space-y-3">
                <Label className="ml-1 text-sm font-semibold tracking-[0.01em] text-slate-600">
                  Lĩnh vực <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold">
                    <SelectValue placeholder="Chọn chuyên mục" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-slate-200 p-2 shadow-xl">
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()} className="rounded-xl py-2.5 font-bold">
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="ml-1 text-sm font-semibold tracking-[0.01em] text-slate-600">Trạng thái đăng bài</Label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus('draft')}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all ${status === 'draft'
                      ? 'border border-slate-200 bg-white text-slate-900 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <Clock className="h-3.5 w-3.5" /> Bản nháp
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('published')}
                    className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-black transition-all ${status === 'published'
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-600'
                      }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Công khai
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4 rounded-[1.25rem] border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
                    <Save className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="mb-0.5 text-xs font-bold tracking-[0.03em] text-indigo-600">Tự động sao lưu</p>
                    <p className="text-[11px] font-medium text-indigo-400">Nội dung sẽ được tự động lưu sau mỗi 30 giây</p>
                  </div>
                </div>

                <div className="space-y-2.5 rounded-[1.25rem] border border-violet-100/50 bg-violet-50/50 p-4">
                  <p className="flex items-center gap-2 text-xs font-bold tracking-[0.03em] text-violet-600">
                    <AlertCircle className="h-3.5 w-3.5" /> Lưu ý bài viết
                  </p>
                  <p className="text-xs font-bold leading-relaxed text-violet-900/70">
                    Mọi bài viết công khai cần tuân thủ quy tắc cộng đồng của JOBIO. Bài viết vi phạm sẽ bị gỡ bỏ không báo trước.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Label className="ml-1 text-sm font-semibold tracking-[0.01em] text-slate-600">Ảnh đại diện bài viết</Label>
                <div
                  className="group relative flex aspect-[16/7] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-violet-300 hover:bg-violet-50/30"
                  onClick={() => document.getElementById('thumbnail')?.click()}
                >
                  {thumbnailPreview ? (
                    <>
                      <div className="absolute inset-0 bg-white/90" />
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className={`relative h-full w-full object-contain p-2 transition-all duration-300 ${isUploadingThumbnail ? 'scale-[1.01] opacity-50 blur-[1.5px]' : ''}`}
                      />
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity ${isUploadingThumbnail ? 'bg-black/25 opacity-100' : 'bg-black/40 opacity-0 group-hover:opacity-100'
                          }`}
                      >
                        {isUploadingThumbnail ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-md">
                              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                            </div>
                            <Badge className="border-white/20 bg-white/20 text-white backdrop-blur-md">
                              Đang tải ảnh...
                            </Badge>
                          </div>
                        ) : (
                          <Badge className="border-white/20 bg-white/20 text-white backdrop-blur-md">Thay đổi ảnh</Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-white p-3 text-slate-400 shadow-sm transition-all group-hover:scale-110 group-hover:text-violet-600">
                        {isUploadingThumbnail ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                      </div>
                      <p className="text-xs font-semibold tracking-[0.02em] text-slate-400">
                        {isUploadingThumbnail ? 'Đang tải ảnh lên Cloudinary...' : 'Tải ảnh lên (16:9)'}
                      </p>
                    </>
                  )}
                </div>
                <input id="thumbnail" type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                {thumbnailUrl && <p className="text-xs font-medium text-emerald-600">Upload thành công.</p>}
              </div>
            </motion.div>
          </div>
        </div>

        <footer className="pb-20 pt-10 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">&copy; 2026 JOBIO Blog Creator Platform</p>
        </footer>
      </div>
    </div>
  );
}
