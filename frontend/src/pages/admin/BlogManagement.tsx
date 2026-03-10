import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText, Plus, Search, Edit3, Trash2, Eye,
    Tag, FolderOpen, MoreHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const fadeUp = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] as const },
});

const tabs = [
    { id: 'posts', label: 'Bài viết', icon: FileText },
    { id: 'categories', label: 'Danh mục', icon: FolderOpen },
    { id: 'tags', label: 'Tags', icon: Tag },
] as const;

type TabId = (typeof tabs)[number]['id'];

const statusColors: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-100 text-slate-600 border-slate-200',
    archived: 'bg-amber-50 text-amber-700 border-amber-200',
};

const statusLabels: Record<string, string> = {
    published: 'Đã đăng',
    draft: 'Nháp',
    archived: 'Lưu trữ',
};

/* ── Mock Data ── */
const MOCK_POSTS = [
    { id: 1, title: 'Bí quyết viết CV chuẩn ATS giúp bạn vượt qua vòng loại', category: 'Kỹ năng tìm việc', status: 'published', author: 'Nguyễn Văn A', date: '12/03/2026', views: 1240, isFeatured: true },
    { id: 2, title: 'Xu hướng thị trường việc làm IT năm 2026', category: 'Xu hướng thị trường', status: 'published', author: 'Trần Thị B', date: '10/03/2026', views: 892, isFeatured: false },
    { id: 3, title: '5 câu hỏi phỏng vấn hóc búa nhất và cách trả lời ghi điểm', category: 'Góc phỏng vấn', status: 'published', author: 'Lê Văn C', date: '05/03/2026', views: 567, isFeatured: false },
    { id: 4, title: 'Cách đàm phán lương hiệu quả khi nhận offer', category: 'Kỹ năng tìm việc', status: 'draft', author: 'Nguyễn Văn A', date: '03/03/2026', views: 0, isFeatured: false },
    { id: 5, title: 'Remote Work: Ưu nhược điểm trong năm 2026', category: 'Xu hướng thị trường', status: 'archived', author: 'Phạm D', date: '20/02/2026', views: 345, isFeatured: false },
];

const MOCK_CATEGORIES = [
    { id: 1, name: 'Kỹ năng tìm việc', slug: 'ky-nang-tim-viec', postCount: 12, color: '#0ea5e9' },
    { id: 2, name: 'Xu hướng thị trường', slug: 'xu-huong-thi-truong', postCount: 8, color: '#8b5cf6' },
    { id: 3, name: 'Góc phỏng vấn', slug: 'goc-phong-van', postCount: 6, color: '#f43f5e' },
    { id: 4, name: 'Doanh nghiệp', slug: 'doanh-nghiep', postCount: 4, color: '#10b981' },
];

const MOCK_TAGS = [
    { id: 1, name: 'CV', slug: 'cv', postCount: 5 },
    { id: 2, name: 'Phỏng vấn', slug: 'phong-van', postCount: 8 },
    { id: 3, name: 'Lương', slug: 'luong', postCount: 3 },
    { id: 4, name: 'Remote', slug: 'remote', postCount: 4 },
    { id: 5, name: 'AI', slug: 'ai', postCount: 6 },
    { id: 6, name: 'Fresher', slug: 'fresher', postCount: 7 },
    { id: 7, name: 'Senior', slug: 'senior', postCount: 2 },
    { id: 8, name: 'Startup', slug: 'startup', postCount: 3 },
];

export default function BlogManagement() {
    const [activeTab, setActiveTab] = useState<TabId>('posts');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto bg-slate-50 min-h-screen">
            <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Quản lý Blog
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quản lý bài viết, danh mục và tags</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Tạo bài viết
                </Button>
            </motion.div>

            {/* Tabs */}
            <motion.div {...fadeUp(0.05)}>
                <div className="flex gap-1 bg-white rounded-xl border border-slate-200 shadow-sm p-1 w-fit">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                                    ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <Icon className="w-4 h-4" />{tab.label}
                            </button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Posts Tab */}
            {activeTab === 'posts' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    {/* Search */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" placeholder="Tìm bài viết..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300" />
                        </div>
                    </div>

                    {/* Posts Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Tiêu đề</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Danh mục</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Trạng thái</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Tác giả</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Ngày</th>
                                    <th className="text-left py-3 px-4 font-semibold text-slate-500">Lượt xem</th>
                                    <th className="text-right py-3 px-4 font-semibold text-slate-500 w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_POSTS.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map((post) => (
                                    <tr key={post.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-slate-900 text-sm line-clamp-1">{post.title}</p>
                                                {post.isFeatured && <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] shrink-0">Featured</Badge>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 text-xs">{post.category}</td>
                                        <td className="py-3 px-4">
                                            <Badge className={`${statusColors[post.status]} border text-[10px] font-bold`}>{statusLabels[post.status]}</Badge>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600 text-xs">{post.author}</td>
                                        <td className="py-3 px-4 text-slate-500 text-xs">{post.date}</td>
                                        <td className="py-3 px-4 text-slate-600 text-xs font-medium">{post.views.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"><Eye className="w-4 h-4" /></button>
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                                                <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Categories Tab */}
            {activeTab === 'categories' && (
                <motion.div {...fadeUp(0.1)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {MOCK_CATEGORIES.map((cat) => (
                            <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow group cursor-pointer">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat.color}15` }}>
                                        <FolderOpen className="w-5 h-5" style={{ color: cat.color }} />
                                    </div>
                                    <button className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 transition-all"><MoreHorizontal className="w-4 h-4" /></button>
                                </div>
                                <h4 className="font-bold text-sm text-slate-900">{cat.name}</h4>
                                <p className="text-xs text-slate-500 mt-1">/{cat.slug} • {cat.postCount} bài viết</p>
                            </div>
                        ))}
                        <button className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer">
                            <Plus className="w-6 h-6" />
                            <span className="text-xs font-semibold">Thêm danh mục</span>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Tags Tab */}
            {activeTab === 'tags' && (
                <motion.div {...fadeUp(0.1)}>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="flex flex-wrap gap-2.5">
                            {MOCK_TAGS.map((tag) => (
                                <div key={tag.id} className="group flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer">
                                    <Tag className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                    <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{tag.name}</span>
                                    <span className="text-[10px] font-bold bg-slate-200/50 text-slate-500 rounded-full px-1.5 py-0.5">{tag.postCount}</span>
                                    <button className="ml-1 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            ))}
                            <button className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer">
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-sm font-semibold">Thêm tag</span>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
