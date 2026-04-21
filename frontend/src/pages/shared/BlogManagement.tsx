import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { blogService } from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BlogPost } from '@/types/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

const statusMap = {
  published: {
    label: 'Đã đăng',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  draft: {
    label: 'Bản nháp',
    color: 'bg-slate-50 text-slate-500 border-slate-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  archived: {
    label: 'Đã lưu trữ',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
} as const;

export default function BlogManagement() {
  const navigate = useNavigate();
  const location = useLocation();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const isCompany = location.pathname.startsWith('/company');
  const basePath = isCompany ? '/company/blog' : '/candidate/blog';

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await blogService.listMyPosts({ search: searchQuery });
      const postData = Array.isArray(response.data)
        ? response.data
        : Array.isArray((response.data as { results?: BlogPost[] })?.results)
          ? (response.data as { results: BlogPost[] }).results
          : [];
      setPosts(postData);
    } catch {
      toast.error('Không thể tải danh sách bài viết');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPosts();
  }, [searchQuery]);

  const confirmDelete = async () => {
    if (!postToDelete) return;

    try {
      setIsDeleting(true);
      await blogService.deletePost(postToDelete.slug);
      toast.success('Đã xóa bài viết thành công');
      setPostToDelete(null);
      await fetchPosts();
    } catch {
      toast.error('Lỗi khi xóa bài viết');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-transparent">
      <div className="sticky top-0 z-20">
        <PageHeader
          title="Quản lý Blog"
          description="Nơi bạn chia sẻ kiến thức, kinh nghiệm và những câu chuyện thú vị trong sự nghiệp."
          icon={BookOpen}
          action={
            <Button
              onClick={() => navigate(`${basePath}/create`)}
              className="h-11 shrink-0 rounded-xl bg-violet-600 px-6 font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Viết bài mới</span>
            </Button>
          }
        />
      </div>

      <div className="relative z-10 flex-1 space-y-6 px-6 pb-6 pt-6 lg:px-8 lg:pb-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200/60 bg-white/50 p-2 backdrop-blur-md md:flex-row">
          <div className="relative w-full flex-1 md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Tìm kiếm bài viết của bạn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-slate-200 bg-white/50 pl-12 font-medium transition-all focus:bg-white"
            />
          </div>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <Button
              variant="outline"
              className="h-11 flex-1 gap-2 rounded-xl border-slate-200 bg-white/50 font-bold hover:bg-white md:flex-none"
            >
              <Filter className="h-4 w-4" /> Lọc
            </Button>
            <Badge variant="outline" className="h-11 rounded-xl border-slate-200 bg-white/10 px-4 font-bold text-slate-500">
              Tổng: {posts.length} bài viết
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl border border-slate-200/50 bg-slate-100/50" />
            ))
          ) : posts.length > 0 ? (
            posts.map((post, idx) => {
              const status = statusMap[post.status as keyof typeof statusMap] ?? statusMap.draft;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative flex flex-col items-start gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 md:flex-row md:items-center"
                >
                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-3xl border border-slate-100 bg-slate-100 transition-transform group-hover:scale-[1.02] md:w-32">
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <BookOpen className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={`${status.color} flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 font-bold`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                      <span className="text-xs font-bold capitalize text-slate-400">
                        {post.category?.name || 'Chưa phân loại'}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="truncate text-lg font-black text-slate-900 transition-colors group-hover:text-violet-600">
                      {post.title}
                    </h3>

                    <p className="line-clamp-1 text-sm font-medium text-slate-500 opacity-80">
                      {post.summary || 'Không có tóm tắt...'}
                    </p>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-6 border-slate-100 md:w-auto md:border-l md:pl-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-tighter text-slate-500">Lượt xem</p>
                        <div className="flex items-center justify-center gap-1 font-black text-slate-900">
                          <Eye className="h-3.5 w-3.5" /> {post.view_count}
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/blog/${post.slug}`)}
                        className="h-10 w-10 rounded-xl text-slate-400 hover:bg-violet-50 hover:text-violet-600"
                      >
                        <ArrowRight className="h-5 w-5" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-3xl border-slate-200 p-2 shadow-xl">
                          <DropdownMenuItem
                            onClick={() => navigate(`${basePath}/edit/${post.slug}`)}
                            className="cursor-pointer gap-3 rounded-xl px-4 py-2.5 font-bold text-slate-600 transition-colors hover:bg-violet-50 hover:text-violet-600 focus:bg-violet-50 focus:text-violet-600"
                          >
                            <Edit3 className="h-4 w-4" /> Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setPostToDelete(post)}
                            className="cursor-pointer gap-3 rounded-xl px-4 py-2.5 font-bold text-red-500 transition-colors hover:bg-red-50 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" /> Xóa bài viết
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="animate-in slide-in-from-bottom-4 space-y-6 rounded-3xl border border-dashed border-slate-300 bg-white p-20 text-center duration-700">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                <BookOpen className="h-10 w-10 text-slate-300" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">Chưa có bài viết nào</h3>
                <p className="mx-auto max-w-sm font-medium text-slate-500">
                  Bắt đầu chia sẻ những kiến thức đầu tiên của bạn với cộng đồng ngay hôm nay.
                </p>
              </div>

              <Button
                onClick={() => navigate(`${basePath}/create`)}
                className="h-12 rounded-3xl bg-violet-600 px-8 font-black text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
              >
                Viết bài ngay <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!postToDelete}
        onClose={() => !isDeleting && setPostToDelete(null)}
        onConfirm={confirmDelete}
        title="Xóa bài viết"
        description={
          postToDelete
            ? `Bạn có chắc muốn xóa "${postToDelete.title}"? Hành động này không thể hoàn tác.`
            : 'Bạn có chắc muốn xóa bài viết này?'
        }
        confirmText="Xóa bài viết"
        cancelText="Hủy"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
