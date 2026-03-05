import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutGrid, List, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
    { value: "-created_at", label: "Mới nhất" },
    { value: "-salary_max", label: "Lương: Cao đến thấp" },
    { value: "-applications_count", label: "Nhiều ứng tuyển nhất" },
    { value: "-is_featured", label: "Featured trước" },
];

interface JobSortProps {
    view: "grid" | "list";
    setView: (view: "grid" | "list") => void;
    onMobileFilterToggle?: () => void;
    totalResults: number;
    sort: string;
    setSort: (sort: string) => void;
}

export function JobSort({ view, setView, onMobileFilterToggle, totalResults, sort, setSort }: JobSortProps) {
    const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label ?? "Mới nhất";

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900">Tất cả việc làm</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                    {totalResults.toLocaleString()} kết quả
                </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Mobile filter button */}
                <Button
                    variant="outline"
                    size="sm"
                    className="sm:hidden flex-1 border-gray-200 text-gray-600 h-8"
                    onClick={onMobileFilterToggle}
                >
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                    Bộ lọc
                </Button>

                {/* Sort dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"
                            className="border-gray-200 text-gray-600 bg-white hover:bg-gray-50 h-8 text-xs gap-1">
                            Sắp xếp: {sortLabel}
                            <ChevronDown className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-white border-gray-200 shadow-lg">
                        {SORT_OPTIONS.map(opt => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => setSort(opt.value)}
                                className={cn("text-sm cursor-pointer", sort === opt.value && "text-primary font-semibold bg-primary/5")}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-[1px] bg-gray-200 mx-0.5 hidden sm:block" />

                {/* View toggle */}
                <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <Button
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className={cn("h-7 w-7 rounded-md", view === "grid" && "bg-white shadow-sm text-primary")}
                        onClick={() => setView("grid")}
                        title="Dạng lưới"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className={cn("h-7 w-7 rounded-md", view === "list" && "bg-white shadow-sm text-primary")}
                        onClick={() => setView("list")}
                        title="Dạng danh sách"
                    >
                        <List className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
