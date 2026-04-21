import api from './api';
import type { PaginatedResponse, BlogPost, BlogCategory, BlogTag } from '@/types/api';

export interface BlogPostPayload {
  title: string;
  summary?: string;
  content: string;
  category_id?: string | number;
  status?: string;
  thumbnail?: string;
}

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

  createPost(data: BlogPostPayload) {
    return api.post<BlogPost>('/api/blog/posts/', data);
  },

  updatePost(slug: string, data: Partial<BlogPostPayload>) {
    return api.patch<BlogPost>(`/api/blog/posts/${slug}/`, data);
  },

  deletePost(slug: string) {
    return api.delete(`/api/blog/posts/${slug}/`);
  },

  uploadImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', 'blog_thumbnail');
    formData.append('is_public', 'true');

    return api.post<{ file_path: string }>('/api/file-uploads/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadThumbnail(slug: string, file: File) {
    const formData = new FormData();
    formData.append('thumbnail', file);
    return api.post<{ thumbnail_url: string }>(`/api/blog/posts/${slug}/upload-thumbnail/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // ─── Categories & Tags ────────────────────────────────────────────────

  listCategories() {
    return api.get<PaginatedResponse<BlogCategory>>('/api/blog/categories/');
  },

  listTags() {
    return api.get<PaginatedResponse<BlogTag>>('/api/blog/tags/');
  },

  getAdminStats() {
    return api.get('/api/blog/posts/admin-stats/');
  },
};
