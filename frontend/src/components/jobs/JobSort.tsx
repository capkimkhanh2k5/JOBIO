import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LayoutGrid, List, ChevronDown, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobSortProps {
    view: "grid" | "list";
    setView: (view: "grid" | "list") => void;
    onMobileFilterToggle?: () => void;
    totalResults: number;
}

export function JobSort({ view, setView, onMobileFilterToggle, totalResults }: JobSortProps) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-1">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Tất cả việc làm</h2>
                <span className="text-sm text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {totalResults} kết quả
                </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Mobile Filter Toggle */}
                <Button
                    variant="outline"
                    size="sm"
                    className="sm:hidden flex-1 border-white/10 bg-background/50"
                    onClick={onMobileFilterToggle}
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Lọc
                </Button>

                {/* Sort Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-white/10 bg-background/50">
                            Sắp xếp: Mới nhất
                            <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>Mới nhất</DropdownMenuItem>
                        <DropdownMenuItem>Lương: Cao đến thấp</DropdownMenuItem>
                        <DropdownMenuItem>Nhiều ứng tuyển nhất</DropdownMenuItem>
                        <DropdownMenuItem>Match cao nhất</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block" />

                {/* View Toggle */}
                <div className="flex items-center bg-muted/50 p-1 rounded-md border border-white/5">
                    <Button
                        variant={view === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setView("grid")}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setView("list")}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
