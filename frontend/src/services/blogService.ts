import api from './api';
import type { PaginatedResponse, BlogPost, BlogCategory, BlogTag } from '@/types/api';

export const blogService = {
  // ─── Posts ────────────────────────────────────────────────────────────

  listPosts(params?: { category_id?: number; tag_id?: number; status?: string; search?: string; is_featured?: boolean; page?: number; page_size?: number; ordering?: string }) {
    return api.get<PaginatedResponse<BlogPost>>('/api/blog/posts/', { params });
  },

  listMyPosts(params?: { search?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<BlogPost>>('/api/blog/posts/my-posts/', { params });
  },

  getPost(slug: string) {
    return api.get<BlogPost>(`/api/blog/posts/${slug}/`);
  },

  incrementViewCount(slug: string) {
    return api.post<{ view_count: number }>(`/api/blog/posts/${slug}/view/`);
  },

  // ─── Post Actions ───────────────────────────────────────────────────

  createPost(data: any) {
    return api.post<BlogPost>('/api/blog/posts/', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updatePost(slug: string, data: any) {
    return api.patch<BlogPost>(`/api/blog/posts/${slug}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  deletePost(slug: string) {
    return api.delete(`/api/blog/posts/${slug}/`);
  },

  // ─── Categories & Tags ────────────────────────────────────────────────

  listCategories() {
    return api.get<PaginatedResponse<BlogCategory>>('/api/blog/categories/');
  },

  listTags() {
    return api.get<PaginatedResponse<BlogTag>>('/api/blog/tags/');
  },
};
