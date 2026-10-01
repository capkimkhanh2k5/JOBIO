import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blogService, BlogPostPayload } from '@/services/blogService';
import type { BlogPost } from '@/types/api';
import { toast } from 'sonner';

interface Props {
  post?: BlogPost | null;
  onClose: () => void;
}

export default function BlogPostFormModal({ post, onClose }: Props) {
  const qc = useQueryClient();
  const isEdit = !!post;
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState<BlogPostPayload>({
    title: post?.title ?? '',
    summary: post?.summary ?? '',
    content: post?.content ?? '',
    category_id: post?.category?.id ?? null,
    status: post?.status ?? 'draft',
    is_featured: post?.is_featured ?? false,
    thumbnail: post?.thumbnail ?? '',
  });

  const { data: cats } = useQuery({
    queryKey: ['admin-blog-categories'],
    queryFn: () => blogService.listCategories().then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: BlogPostPayload) =>
      isEdit ? blogService.updatePost(post!.slug, data) : blogService.createPost(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-posts'] });
      qc.invalidateQueries({ queryKey: ['admin-blog-stats'] });
      toast.success(isEdit ? 'Đã cập nhật bài viết' : 'Đã tạo bài viết mới');
      onClose();
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const set = (k: keyof BlogPostPayload, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    setForm({
      title: post?.title ?? '',
      summary: post?.summary ?? '',
      content: post?.content ?? '',
      category_id: post?.category?.id ?? null,
      status: post?.status ?? 'draft',
      is_featured: post?.is_featured ?? false,
      thumbnail: post?.thumbnail ?? '',
    });
  }, [post]);

  const handleUploadThumbnail = async (file: File) => {
    try {
      setUploadingImage(true);
      const response = await blogService.uploadImage(file);
      const uploadedPath = response.data?.file_path;
      if (!uploadedPath) {
        toast.error('Upload ảnh thất bại');
        return;
      }

      set('thumbnail', uploadedPath);
      toast.success('Đã tải ảnh bìa');
    } catch {
      toast.error('Không thể upload ảnh bìa');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="font-black text-foreground">{isEdit ? 'Sửa bài viết' : 'Viết bài mới'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tiêu đề *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              placeholder="Nhập tiêu đề bài viết..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Danh mục</label>
              <select value={form.category_id ?? ''} onChange={e => set('category_id', e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-card">
                <option value="">Không có danh mục</option>
                {cats?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trạng thái</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-card">
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tóm tắt</label>
            <textarea value={form.summary ?? ''} onChange={e => set('summary', e.target.value)} rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium resize-none"
              placeholder="Mô tả ngắn về bài viết..." />
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ảnh bìa</label>
            <div className="mt-1 rounded-xl border border-border p-3 bg-muted/50 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadThumbnail(file);
                  }
                }}
                className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-primary"
              />
              {uploadingImage && (
                <p className="text-xs text-primary font-semibold flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải ảnh...
                </p>
              )}
              {form.thumbnail && (
                <div className="space-y-2">
                  <img src={form.thumbnail} alt="thumbnail" className="w-full h-40 object-cover rounded-lg border border-border" />
                  <input
                    value={form.thumbnail}
                    onChange={e => set('thumbnail', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border text-xs font-medium"
                    placeholder="URL ảnh bìa"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nội dung *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={8}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium resize-none font-mono"
              placeholder="Nội dung bài viết (hỗ trợ Markdown)..." />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured ?? false} onChange={e => set('is_featured', e.target.checked)}
              className="w-4 h-4 rounded accent-primary" />
            <span className="text-sm font-bold text-foreground/80">Bài viết nổi bật</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title || !form.content}
            className="bg-primary hover:bg-primary text-white rounded-xl font-bold px-6">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
          </Button>
        </div>
      </div>
    </div>
  );
}
