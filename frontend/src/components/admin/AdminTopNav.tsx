import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Briefcase,
    Building2,
    CreditCard,
    Loader2,
    Search,
    Users,
    Wallet,
    X,
    type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { NotificationBell } from '@/components/shared/notifications/NotificationBell';
import { dashboardService } from '@/services/dashboardService';
import { companyService } from '@/services/companyService';
import { cn } from '@/lib/utils';

type SearchItem = Record<string, any>;

type AdminSearchSource = {
    id: string;
    label: string;
    route: string;
    icon: LucideIcon;
    iconClassName: string;
    queryFn: (term: string) => Promise<unknown>;
    getTitle: (item: SearchItem) => string;
    getSubtitle: (item: SearchItem) => string;
    getSearchValue?: (item: SearchItem, term: string) => string;
    getImageUrl?: (item: SearchItem) => string;
    getItemRoute?: (item: SearchItem, term: string) => string;
};

type AdminPageLink = {
    label: string;
    route: string;
    aliases: string;
    icon: LucideIcon;
};

const MIN_SEARCH_LENGTH = 2;
const RESULT_LIMIT = 3;

const ROLE_LABELS: Record<string, string> = {
    candidate: 'Ứng viên',
    company: 'Nhà tuyển dụng',
    admin: 'Admin',
};

const STATUS_LABELS: Record<string, string> = {
    active: 'Hoạt động',
    banned: 'Bị khóa',
    published: 'Đang hiển thị',
    draft: 'Bản nháp',
    closed: 'Đã đóng',
    expired: 'Hết hạn',
    pending: 'Chờ xử lý',
    reviewing: 'Đang xem xét',
    resolved: 'Đã xử lý',
    rejected: 'Từ chối',
    completed: 'Thành công',
    failed: 'Thất bại',
    refunded: 'Đã hoàn tiền',
};

const ADMIN_PAGE_LINKS: AdminPageLink[] = [
    { label: 'Quản lý Khách hàng', route: '/admin/users', aliases: 'user nguoi dung ung vien nha tuyen dung tai khoan', icon: Users },
    { label: 'Tài chính', route: '/admin/financial', aliases: 'tai chinh giao dich doanh thu thanh toan billing', icon: Wallet },
    { label: 'Thị trường Việc làm', route: '/admin/jobs', aliases: 'viec lam job tin tuyen dung cong ty', icon: Briefcase },
    { label: 'Công ty', route: '/admin/moderation', aliases: 'cong ty nha tuyen dung doanh nghiep xac minh kiem duyet moderation', icon: Building2 },
];

function text(value: unknown) {
    if (value === null || value === undefined) return '';
    return String(value);
}

function normalizeText(value: string) {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

function getItems(data: unknown): SearchItem[] {
    if (Array.isArray(data)) return data as SearchItem[];
    if (data && typeof data === 'object') {
        const results = (data as { results?: unknown }).results;
        if (Array.isArray(results)) return results as SearchItem[];
    }
    return [];
}

function getTotalCount(data: unknown, fallback = 0) {
    if (data && typeof data === 'object') {
        const count = (data as { count?: unknown }).count;
        if (typeof count === 'number') return count;
    }
    return fallback;
}

function buildSearchUrl(route: string, term: string, extraParams?: Record<string, string>) {
    const params = new URLSearchParams(extraParams);
    params.set('search', term);
    return `${route}?${params.toString()}`;
}

function formatMoney(amount: unknown) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return '';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value);
}

function getInitials(value: string) {
    const words = value.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function SearchResultAvatar({ source, item }: { source: AdminSearchSource; item: SearchItem }) {
    const [imageFailed, setImageFailed] = useState(false);
    const imageUrl = source.getImageUrl?.(item);
    const title = source.getTitle(item);
    const Icon = source.icon;

    if (imageUrl && !imageFailed) {
        return (
            <span className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={() => setImageFailed(true)}
                />
            </span>
        );
    }

    if (source.id === 'users') {
        return (
            <span className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shrink-0 text-xs font-black">
                {getInitials(title)}
            </span>
        );
    }

    return (
        <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', source.iconClassName)}>
            <Icon className="w-4 h-4" />
        </span>
    );
}

const SEARCH_SOURCES: AdminSearchSource[] = [
    {
        id: 'users',
        label: 'Users',
        route: '/admin/users',
        icon: Users,
        iconClassName: 'text-violet-600 bg-violet-50',
        queryFn: async (term) => {
            const response = await dashboardService.listUsers({ search: term, page: 1, page_size: RESULT_LIMIT });
            return response.data;
        },
        getTitle: (item) => text(item.full_name) || text(item.email) || `User #${item.id}`,
        getSubtitle: (item) => [text(item.email), ROLE_LABELS[text(item.role)] ?? text(item.role)].filter(Boolean).join(' - '),
        getSearchValue: (item, term) => text(item.email) || text(item.full_name) || term,
        getImageUrl: (item) => text(item.avatar_url),
    },
    {
        id: 'jobs',
        label: 'Việc làm',
        route: '/admin/jobs',
        icon: Briefcase,
        iconClassName: 'text-blue-600 bg-blue-50',
        queryFn: async (term) => {
            const response = await dashboardService.listAdminJobs({ search: term, page: 1, page_size: RESULT_LIMIT });
            return response.data;
        },
        getTitle: (item) => text(item.title) || `Tin tuyển dụng #${item.id}`,
        getSubtitle: (item) => [
            text(item.company_name) || text(item.company?.company_name),
            STATUS_LABELS[text(item.status)] ?? text(item.status),
        ].filter(Boolean).join(' - '),
        getSearchValue: (item, term) => text(item.title) || text(item.company_name) || term,
        getImageUrl: (item) => text(item.logo_url) || text(item.company_logo),
    },
    {
        id: 'companies',
        label: 'Công ty',
        route: '/admin/moderation',
        icon: Building2,
        iconClassName: 'text-emerald-600 bg-emerald-50',
        queryFn: async (term) => {
            const response = await companyService.list({ search: term, page: 1, page_size: RESULT_LIMIT });
            return response.data;
        },
        getTitle: (item) => text(item.company_name) || `Công ty #${item.id}`,
        getSubtitle: (item) => [
            text(item.industry?.name) || text(item.industry_name),
            item.tax_code ? `MST: ${item.tax_code}` : '',
            STATUS_LABELS[text(item.verification_status)] ?? text(item.verification_status),
        ].filter(Boolean).join(' - '),
        getSearchValue: (item, term) => text(item.company_name) || text(item.tax_code) || term,
        getImageUrl: (item) => text(item.logo_url),
    },
    {
        id: 'financial',
        label: 'Tài chính',
        route: '/admin/financial',
        icon: CreditCard,
        iconClassName: 'text-green-600 bg-green-50',
        queryFn: async (term) => {
            const response = await dashboardService.listAdminTransactions({ search: term, page: 1, page_size: RESULT_LIMIT });
            return response.data;
        },
        getTitle: (item) => text(item.reference_code) || `Giao dịch #${item.id}`,
        getSubtitle: (item) => [
            text(item.company_name) || text(item.user_email),
            formatMoney(item.amount),
            STATUS_LABELS[text(item.status)] ?? text(item.status),
        ].filter(Boolean).join(' - '),
        getSearchValue: (item, term) => text(item.reference_code) || text(item.user_email) || text(item.company_name) || term,
        getImageUrl: (item) => text(item.logo_url) || text(item.company_logo) || text(item.company_logo_url),
    },
];

export function AdminTopNav() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLFormElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedQuery(query.trim());
        }, 250);
        return () => window.clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const trimmedQuery = query.trim();
    const canSearch = debouncedQuery.length >= MIN_SEARCH_LENGTH;
    const isDebouncing = trimmedQuery.length >= MIN_SEARCH_LENGTH && debouncedQuery !== trimmedQuery;

    const queryResults = useQueries({
        queries: SEARCH_SOURCES.map((source) => ({
            queryKey: ['admin-top-search', source.id, debouncedQuery],
            queryFn: () => source.queryFn(debouncedQuery),
            enabled: canSearch,
            staleTime: 30_000,
            gcTime: 120_000,
        })),
    });

    const moduleMatches = useMemo(() => {
        if (trimmedQuery.length < MIN_SEARCH_LENGTH) return [];
        const normalizedQuery = normalizeText(trimmedQuery);
        return ADMIN_PAGE_LINKS.filter((page) =>
            normalizeText(`${page.label} ${page.aliases}`).includes(normalizedQuery)
        ).slice(0, 4);
    }, [trimmedQuery]);

    const groups = SEARCH_SOURCES.map((source, index) => {
        const result = queryResults[index];
        const items = getItems(result.data).slice(0, RESULT_LIMIT);
        return {
            source,
            items,
            count: getTotalCount(result.data, items.length),
            isLoading: result.isFetching,
            isError: result.isError,
        };
    });

    const dataGroups = isDebouncing ? [] : groups.filter((group) => group.items.length > 0);
    const isSearching = trimmedQuery.length >= MIN_SEARCH_LENGTH && (isDebouncing || queryResults.some((result) => result.isFetching));
    const hasQueryError = !isDebouncing && queryResults.some((result) => result.isError);
    const hasAnyMatch = moduleMatches.length > 0 || dataGroups.length > 0;

    const closeSearch = () => {
        setIsOpen(false);
    };

    const navigateTo = (to: string) => {
        navigate(to);
        closeSearch();
    };

    const navigateToSource = (source: AdminSearchSource, term: string) => {
        navigateTo(buildSearchUrl(source.route, term));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const term = trimmedQuery;
        if (!term) return;

        const currentSource = SEARCH_SOURCES.find((source) =>
            location.pathname === source.route || location.pathname.startsWith(`${source.route}/`)
        );
        const firstMatchedSource = dataGroups[0]?.source;
        navigateToSource(currentSource ?? firstMatchedSource ?? SEARCH_SOURCES[0], term);
    };

    const handleResultClick = (source: AdminSearchSource, item: SearchItem) => {
        const term = source.getSearchValue?.(item, trimmedQuery) || trimmedQuery;
        navigateTo(source.getItemRoute?.(item, term) ?? buildSearchUrl(source.route, term));
    };

    const clearQuery = () => {
        setQuery('');
        setDebouncedQuery('');
        closeSearch();
    };

    return (
        <header className="h-14 shrink-0 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6">
            <div className="w-1/4" />

            <form ref={containerRef} onSubmit={handleSubmit} className="flex-1 max-w-xl relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(event) => {
                        if (event.key === 'Escape') closeSearch();
                    }}
                    placeholder="Tìm kiếm nhanh hệ thống..."
                    className="w-full pl-10 pr-10 py-1.5 rounded-full border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/10 focus:border-violet-300 transition-all bg-slate-50/50"
                />
                {query && (
                    <button
                        type="button"
                        onClick={clearQuery}
                        aria-label="Xóa từ khóa"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}

                {isOpen && trimmedQuery && (
                    <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 overflow-hidden z-50">
                        {trimmedQuery.length < MIN_SEARCH_LENGTH ? (
                            <div className="p-4 text-xs font-semibold text-slate-500">
                                Nhập ít nhất {MIN_SEARCH_LENGTH} ký tự để tìm kiếm.
                            </div>
                        ) : (
                            <div className="max-h-[70vh] overflow-y-auto p-2">
                                {moduleMatches.length > 0 && (
                                    <div className="mb-2">
                                        <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            Khu vực quản trị
                                        </div>
                                        <div className="space-y-1">
                                            {moduleMatches.map((page) => {
                                                const Icon = page.icon;
                                                return (
                                                    <button
                                                        key={page.route}
                                                        type="button"
                                                        onClick={() => navigateTo(page.route)}
                                                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                                                    >
                                                        <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                                                            <Icon className="w-4 h-4" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-bold text-slate-900 truncate">{page.label}</span>
                                                            <span className="block text-[11px] font-medium text-slate-400 truncate">{page.route}</span>
                                                        </span>
                                                        <ArrowRight className="w-4 h-4 text-slate-300" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {isSearching && !hasAnyMatch && (
                                    <div className="flex items-center justify-center gap-2 py-8 text-xs font-bold text-slate-500">
                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                        Đang tìm kiếm...
                                    </div>
                                )}

                                {!isSearching && !hasAnyMatch && (
                                    <div className="py-8 px-4 text-center">
                                        <p className="text-sm font-bold text-slate-700">Không tìm thấy kết quả</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">Thử từ khóa khác hoặc bấm Enter để tìm trong module hiện tại.</p>
                                    </div>
                                )}

                                {dataGroups.map((group) => {
                                    const Icon = group.source.icon;
                                    return (
                                        <div key={group.source.id} className="mb-2 last:mb-0">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    <span className={cn('w-5 h-5 rounded-md flex items-center justify-center', group.source.iconClassName)}>
                                                        <Icon className="w-3 h-3" />
                                                    </span>
                                                    {group.source.label}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigateToSource(group.source, trimmedQuery)}
                                                    className="text-[11px] font-bold text-violet-600 hover:text-violet-700"
                                                >
                                                    Xem tất cả {group.count > group.items.length ? `(${group.count})` : ''}
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {group.items.map((item) => (
                                                    <button
                                                        key={`${group.source.id}-${item.id ?? group.source.getTitle(item)}`}
                                                        type="button"
                                                        onClick={() => handleResultClick(group.source, item)}
                                                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 transition-colors"
                                                    >
                                                        <SearchResultAvatar source={group.source} item={item} />
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block text-sm font-bold text-slate-900 truncate">{group.source.getTitle(item)}</span>
                                                            <span className="block text-[11px] font-medium text-slate-400 truncate">{group.source.getSubtitle(item)}</span>
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {hasQueryError && (
                                    <div className="border-t border-slate-100 px-3 py-2 text-[11px] font-semibold text-amber-600">
                                        Một số nhóm dữ liệu chưa tải được.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </form>

            <div className="w-1/4 flex items-center justify-end gap-4">
                <NotificationBell />

                <div className="h-4 w-px bg-slate-200" />

                <Logo
                    to="/"
                    showText={false}
                    imageClassName="h-8 w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
                />
            </div>
        </header>
    );
}
