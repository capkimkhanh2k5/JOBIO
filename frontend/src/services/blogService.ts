import api from './api';
import type { PaginatedResponse, BlogPost, BlogCategory, BlogTag } from '@/types/api';

export interface BlogPostPayload {
  title: string;
  summary?: string;
  content: string;
  category_id?: string | number | null;
  tag_ids?: number[];
  status?: 'draft' | 'published' | 'archived';
  thumbnail?: string;
  is_featured?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface BlogCategoryPayload {
  name: string;
  description?: string;
}

export interface BlogTagPayload {
  name: string;
}

export const blogService = {
  // ─── Posts ────────────────────────────────────────────────────────────

  listPosts(params?: {
    category_id?: number;
    tag_id?: number;
    status?: string;
    search?: string;
    is_featured?: boolean;
    page?: number;
    page_size?: number;
    ordering?: string;
  }) {
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

  publishPost(slug: string) {
    return api.post<{ status: string; published_at: string }>(`/api/blog/posts/${slug}/publish/`);
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

  // ─── Categories ────────────────────────────────────────────────────

  listCategories(params?: { search?: string; page?: number }) {
    return api.get<PaginatedResponse<BlogCategory>>('/api/blog/categories/', { params });
  },

  getCategory(slug: string) {
    return api.get<BlogCategory>(`/api/blog/categories/${slug}/`);
  },

  createCategory(data: BlogCategoryPayload) {
    return api.post<BlogCategory>('/api/blog/categories/', data);
  },

  updateCategory(slug: string, data: Partial<BlogCategoryPayload>) {
    return api.patch<BlogCategory>(`/api/blog/categories/${slug}/`, data);
  },

  deleteCategory(slug: string) {
    return api.delete(`/api/blog/categories/${slug}/`);
  },

  // ─── Tags ──────────────────────────────────────────────────────────

  listTags(params?: { search?: string; page?: number }) {
    return api.get<PaginatedResponse<BlogTag>>('/api/blog/tags/', { params });
  },

  getTag(slug: string) {
    return api.get<BlogTag>(`/api/blog/tags/${slug}/`);
  },

  createTag(data: BlogTagPayload) {
    return api.post<BlogTag>('/api/blog/tags/', data);
  },

  updateTag(slug: string, data: Partial<BlogTagPayload>) {
    return api.patch<BlogTag>(`/api/blog/tags/${slug}/`, data);
  },

  deleteTag(slug: string) {
    return api.delete(`/api/blog/tags/${slug}/`);
  },

  // ─── Admin ────────────────────────────────────────────────────────

  getAdminStats() {
    return api.get<{
      total_posts: number;
      published_posts: number;
      draft_posts: number;
      total_views: number;
    }>('/api/blog/posts/admin-stats/');
  },
};
