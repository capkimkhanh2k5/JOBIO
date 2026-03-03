import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search, MapPin, Briefcase, DollarSign, Command, X, SlidersHorizontal, ChevronDown, ChevronUp, CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Command as CommandPrimitive, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { useFilterStore, CVSearchFilters as Filters } from '@/store/filterStore';

const SKILLS_SUGGESTIONS = [
    "React", "Vue", "Angular", "Node.js", "Python", "Java", "C#", "Go",
    "AWS", "Docker", "Kubernetes", "Figma", "UI/UX", "SEO"
];

const LOCATIONS = [
    "Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Bình Dương", "Remote"
];



export const CVSearchFiltersPanel = () => {
    const filters = useFilterStore((state: any) => state.cvFilters);
    const updateCVSearchFilter = useFilterStore((state: any) => state.updateCVSearchFilter);
    const resetCVSearchFilters = useFilterStore((state: any) => state.resetCVSearchFilters);
    const [skillsOpen, setSkillsOpen] = useState(false);
    const [skillsSearch, setSkillsSearch] = useState('');

    // Custom expand/collapse for sections
    const [sections, setSections] = useState({
        location: true,
        experience: true,
        education: true,
        status: true,
        salary: false
    });

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSkillSelect = (skill: string) => {
        if (!filters.skills.includes(skill)) {
            updateCVSearchFilter({ skills: [...filters.skills, skill] });
        }
        setSkillsSearch('');
        setSkillsOpen(false);
    };

    const handleSkillRemove = (skill: string) => {
        updateCVSearchFilter({ skills: filters.skills.filter((s: string) => s !== skill) });
    };

    const activeFilterCount = Object.keys(filters).reduce((acc, key) => {
        if (key === 'q') return acc;
        const val = filters[key as keyof Filters];
        if (Array.isArray(val) && val.length > 0) return acc + 1;
        if (typeof val === 'number' && val > 0) return acc + 1;
        if (typeof val === 'string' && val !== 'all' && val !== '') return acc + 1;
        if (typeof val === 'boolean' && val === true) return acc + 1;
        return acc;
    }, 0);

    return (
        <div className="w-full flex flex-col h-full bg-card/40 backdrop-blur-md rounded-2xl border border-border/40 shadow-sm overflow-hidden">
            {/* Header Sticky */}
            <div className="p-5 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-20">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    Bộ lọc tìm kiếm
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="bg-primary/10 text-primary ml-1">
                            {activeFilterCount}
                        </Badge>
                    )}
                </h3>
                {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={resetCVSearchFilters} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                        Xóa lọc
                    </Button>
                )}
            </div>

            {/* Scrollable Filters */}
            <div className="flex-1 overflow-y-auto p-5 space-y-7 pb-20 custom-scrollbar">

                {/* Search string */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                        <Search className="w-4 h-4" /> Từ khóa
                    </Label>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                        <Input
                            placeholder="Tên, vị trí công việc..."
                            className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30"
                            value={filters.q}
                            onChange={(e) => updateCVSearchFilter({ q: e.target.value })}
                        />
                    </div>
                </div>

                {/* Skills Multi Auto-complete */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-foreground/80">
                        <Command className="w-4 h-4" /> Kỹ năng chuyên môn
                    </Label>
                    <Popover open={skillsOpen} onOpenChange={setSkillsOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" role="combobox" aria-expanded={skillsOpen} className="w-full justify-between bg-background/50 border-border/50 text-muted-foreground hover:bg-card">
                                {filters.skills.length > 0 ? `${filters.skills.length} kỹ năng đã chọn` : "Thêm kỹ năng..."}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <CommandPrimitive>
                                <CommandInput placeholder="Tìm kiếm kỹ năng..." value={skillsSearch} onValueChange={setSkillsSearch} />
                                <CommandList>
                                    <CommandEmpty>Không tìm thấy kỹ năng phù hợp.</CommandEmpty>
                                    <CommandGroup>
                                        {SKILLS_SUGGESTIONS.filter((s: string) => !filters.skills.includes(s)).map((skill: string) => (
                                            <CommandItem key={skill} value={skill} onSelect={() => handleSkillSelect(skill)}>
                                                <CheckCircle className={`mr-2 h-4 w-4 opacity-0`} />
                                                {skill}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </CommandPrimitive>
                        </PopoverContent>
                    </Popover>

                    <div className="flex flex-wrap gap-2 mt-2">
                        <AnimatePresence>
                            {filters.skills.map((skill: string) => (
                                <motion.div key={skill} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                    <Badge variant="secondary" className="pl-2 pr-1 py-1 gap-1 items-center bg-secondary/40 border border-secondary/20 hover:bg-secondary/60">
                                        <span className="text-xs font-medium">{skill}</span>
                                        <button type="button" onClick={() => handleSkillRemove(skill)} className="rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* divider */}
                <div className="h-px w-full bg-border/40" />

                {/* Location */}
                <div className="space-y-3">
                    <button onClick={() => toggleSection('location')} className="w-full flex justify-between items-center group font-semibold text-sm text-foreground/80 hover:text-foreground transition-colors">
                        <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Địa điểm</span>
                        {sections.location ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
                    </button>
                    {sections.location && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button
                                variant={filters.location === 'all' ? 'default' : 'outline'}
                                size="sm"
                                className={`justify-start text-xs ${filters.location === 'all' ? 'shadow-md shadow-primary/10' : 'bg-background/50 border-border/50'}`}
                                onClick={() => updateCVSearchFilter({ location: 'all' })}
                            >
                                Tất cả
                            </Button>
                            {LOCATIONS.slice(0, 5).map(loc => (
                                <Button
                                    key={loc}
                                    variant={filters.location === loc ? 'default' : 'outline'}
                                    size="sm"
                                    className={`justify-start text-xs ${filters.location === loc ? 'shadow-md shadow-primary/10' : 'bg-background/50 border-border/50'}`}
                                    onClick={() => updateCVSearchFilter({ location: loc })}
                                >
                                    {loc}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Experience */}
                <div className="space-y-4">
                    <button onClick={() => toggleSection('experience')} className="w-full flex justify-between items-center group font-semibold text-sm text-foreground/80 hover:text-foreground transition-colors">
                        <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> Kinh nghiệm tối thiểu</span>
                        {sections.experience ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
                    </button>
                    {sections.experience && (
                        <div className="px-2 pt-2 space-y-4">
                            <Slider
                                value={[filters.experience_min]}
                                max={15}
                                step={1}
                                onValueChange={(val) => updateCVSearchFilter({ experience_min: val[0] })}
                                className="[&>span:first-child]:h-1.5 [&>span:first-child]:bg-secondary [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:transition-transform"
                            />
                            <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                <span>Mới tốt nghiệp</span>
                                <span className="text-primary font-bold">{filters.experience_min} năm +</span>
                                <span>15+ năm</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Search Status */}
                <div className="space-y-3">
                    <button onClick={() => toggleSection('status')} className="w-full flex justify-between items-center group font-semibold text-sm text-foreground/80 hover:text-foreground transition-colors">
                        <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Trạng thái tìm việc</span>
                        {sections.status ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
                    </button>
                    {sections.status && (
                        <div className="space-y-2.5 pt-1">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'active', label: 'Đang tích cực tìm việc' },
                                { id: 'passive', label: 'Chỉ nhận cơ hội tốt' },
                            ].map(status => (
                                <div key={status.id} className="flex items-center justify-between group cursor-pointer" onClick={() => updateCVSearchFilter({ search_status: status.id as any })}>
                                    <Label className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        {status.label}
                                    </Label>
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${filters.search_status === status.id ? 'border-primary' : 'border-input group-hover:border-primary/50'}`}>
                                        {filters.search_status === status.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Salary */}
                <div className="space-y-4">
                    <button onClick={() => toggleSection('salary')} className="w-full flex justify-between items-center group font-semibold text-sm text-foreground/80 hover:text-foreground transition-colors">
                        <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Mức lương mong đợi (USD)</span>
                        {sections.salary ? <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />}
                    </button>
                    {sections.salary && (
                        <div className="px-2 pt-2 space-y-4 pb-4">
                            <Slider
                                value={[filters.salary_max]}
                                max={10000}
                                step={500}
                                onValueChange={(val) => updateCVSearchFilter({ salary_max: val[0] })}
                                className="[&>span:first-child]:h-1.5 [&>span:first-child]:bg-secondary [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:border-primary [&_[role=slider]]:hover:scale-110 [&_[role=slider]]:transition-transform"
                            />
                            <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                <span>Bất kỳ</span>
                                <span className="text-primary font-bold">≤ ${filters.salary_max}</span>
                                <span>$10,000+</span>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
