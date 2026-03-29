import api from './api';
import type { PaginatedResponse, BlogPost, BlogCategory, BlogTag } from '@/types/api';

export const blogService = {
  // ─── Posts ────────────────────────────────────────────────────────────

  listPosts(params?: { category_id?: number; tag_id?: number; status?: string; search?: string; is_featured?: boolean; page?: number; page_size?: number; ordering?: string }) {
    return api.get<PaginatedResponse<BlogPost>>('/api/blog/posts/', { params });
  },

  getPost(slug: string) {
    return api.get<BlogPost>(`/api/blog/posts/${slug}/`);
  },

  incrementViewCount(slug: string) {
    return api.post<{ view_count: number }>(`/api/blog/posts/${slug}/view/`);
  },

  // ─── Categories & Tags ────────────────────────────────────────────────

  listCategories() {
    return api.get<PaginatedResponse<BlogCategory>>('/api/blog/categories/');
  },

  listTags() {
    return api.get<PaginatedResponse<BlogTag>>('/api/blog/tags/');
  },
};
