import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, FolderOpen, Tag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blogService } from '@/services/blogService';
import type { BlogCategory } from '@/types/api';
import { toast } from 'sonner';

// ─── Category Form Modal ──────────────────────────────────────────────────────

interface CategoryProps {
  category?: BlogCategory | null;
  onClose: () => void;
}

export function CategoryFormModal({ category, onClose }: CategoryProps) {
  const qc = useQueryClient();
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? '');
  const [desc, setDesc] = useState(category?.description ?? '');

  useEffect(() => {
    setName(category?.name ?? '');
    setDesc(category?.description ?? '');
  }, [category]);

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? blogService.updateCategory(category!.slug, { name, description: desc })
        : blogService.createCategory({ name, description: desc }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-categories'] });
      toast.success(isEdit ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục mới');
      onClose();
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-slate-900">{isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên danh mục *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
              placeholder="VD: Tuyển dụng, Nghề nghiệp..." />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium resize-none"
              placeholder="Mô tả ngắn..." />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isEdit ? 'Lưu' : 'Tạo danh mục'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Tag Form Modal ───────────────────────────────────────────────────────────

interface TagProps {
  onClose: () => void;
}

export function TagFormModal({ onClose }: TagProps) {
  const qc = useQueryClient();
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () => blogService.createTag({ name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog-tags'] });
      toast.success('Đã thêm tag mới');
      onClose();
    },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="font-black text-slate-900">Thêm Tag mới</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Tag *</label>
          <input value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) mutation.mutate(); }}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
            placeholder="VD: remote-work, kỹ năng mềm..." />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} className="rounded-xl">Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold px-6">
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Tạo Tag
          </Button>
        </div>
      </div>
    </div>
  );
}
