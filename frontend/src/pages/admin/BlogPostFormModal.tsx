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

  const [form, setForm] = useState<BlogPostPayload>({
    title: post?.title ?? '',
    summary: post?.summary ?? '',
    content: post?.content ?? '',
    category_id: post?.category?.id ?? null,
    status: post?.status ?? 'draft',
    is_featured: post?.is_featured ?? false,
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
    });
  }, [post]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-slate-900">{isEdit ? 'Sửa bài viết' : 'Viết bài mới'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiêu đề *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
              placeholder="Nhập tiêu đề bài viết..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh mục</label>
              <select value={form.category_id ?? ''} onChange={e => set('category_id', e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium bg-white">
                <option value="">Không có danh mục</option>
                {cats?.results?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium bg-white">
                <option value="draft">Bản nháp</option>
                <option value="published">Xuất bản</option>
                <option value="archived">Lưu trữ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tóm tắt</label>
            <textarea value={form.summary ?? ''} onChange={e => set('summary', e.target.value)} rows={2}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium resize-none"
              placeholder="Mô tả ngắn về bài viết..." />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung *</label>
            <textarea value={form.content} onChange={e => set('content', e.target.value)} rows={8}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium resize-none font-mono"
              placeholder="Nội dung bài viết (hỗ trợ Markdown)..." />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured ?? false} onChange={e => set('is_featured', e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600" />
            <span className="text-sm font-bold text-slate-700">Bài viết nổi bật</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.title || !form.content}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Lưu thay đổi' : 'Tạo bài viết'}
          </Button>
        </div>
      </div>
    </div>
  );
}
