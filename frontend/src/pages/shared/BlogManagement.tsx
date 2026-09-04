import { EmptyState } from '@/components/shared/EmptyState';
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
    color: 'bg-muted text-muted-foreground border-border',
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
  const basePath = isCompany ? '/company/blog' : '/blog';

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
      <div>
        <PageHeader
          title="Quản lý Blog"
          description="Nơi bạn chia sẻ kiến thức, kinh nghiệm và những câu chuyện thú vị trong sự nghiệp."
          icon={BookOpen}
          action={
            <Button
              onClick={() => navigate(`${basePath}/create`)}
              className="h-11 shrink-0 rounded-xl bg-teal-600 px-6 font-bold text-white shadow-md shadow-teal-500/20 hover:bg-teal-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Viết bài mới</span>
            </Button>
          }
        />
      </div>

      <div className="relative z-10 flex-1 space-y-6 px-6 pb-6 pt-6 lg:px-8 lg:pb-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-border/60 bg-card/50 p-2 backdrop-blur-md md:flex-row">
          <div className="relative w-full flex-1 md:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Tìm kiếm bài viết của bạn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 rounded-xl border-border bg-card/50 pl-12 font-medium transition-all focus:bg-card"
            />
          </div>

          <div className="flex w-full items-center gap-2 md:w-auto">
            <Badge variant="outline" className="h-11 rounded-xl border-border bg-card/10 px-4 font-bold text-muted-foreground">
              Tổng: {posts.length} bài viết
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-3xl border border-border/50 bg-muted/50" />
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
                  onClick={() => {
                    if (post.status === 'draft') {
                      navigate(`${basePath}/edit/${post.slug}`);
                    } else {
                      navigate(`/blog/${post.slug}`);
                    }
                  }}
                  className="group relative flex flex-col items-start gap-6 rounded-3xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-xl hover:shadow-slate-200/40 md:flex-row md:items-center cursor-pointer"
                >
                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-3xl border border-border/60 bg-muted transition-transform group-hover:scale-[1.02] md:w-32">
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt={post.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
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
                      <span className="text-xs font-bold capitalize text-muted-foreground/60">
                        {post.category?.name || 'Chưa phân loại'}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    <h3 className="truncate text-lg font-black text-foreground transition-colors group-hover:text-teal-600">
                      {post.title}
                    </h3>

                    <p className="line-clamp-1 text-sm font-medium text-muted-foreground opacity-80">
                      {post.summary || 'Không có tóm tắt...'}
                    </p>
                  </div>

                  <div className="flex w-full shrink-0 items-center gap-5 border-border/60 md:w-auto md:border-l md:pl-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Lượt xem</p>
                        <div className="flex items-center justify-center gap-1 font-black text-foreground">
                          <Eye className="h-3.5 w-3.5" /> {post.view_count}
                        </div>
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Chỉnh sửa bài viết"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`${basePath}/edit/${post.slug}`);
                        }}
                        className="h-9 w-9 rounded-xl text-teal-600 hover:bg-teal-50 hover:text-teal-700 cursor-pointer"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xóa bài viết"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostToDelete(post);
                        }}
                        className="h-9 w-9 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <EmptyState
              icon={BookOpen}
              title="Chưa có bài viết nào"
              description="Bắt đầu chia sẻ những kiến thức đầu tiên của bạn với cộng đồng ngay hôm nay."
              action={{
                label: 'Viết bài ngay',
                onClick: () => navigate(`${basePath}/create`),
                icon: ArrowRight,
              }}
            />
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
