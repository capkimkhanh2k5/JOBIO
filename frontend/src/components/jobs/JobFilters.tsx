import { useFilterStore } from "@/store/useStore";
import { useQuery } from "@tanstack/react-query";
import { taxonomyService } from "@/services/taxonomyService";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Search, RotateCcw, Wifi } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const JOB_TYPES = [
    { id: "full-time", label: "Full-time" },
    { id: "part-time", label: "Part-time" },
    { id: "contract", label: "Contract" },
    { id: "internship", label: "Thực tập" },
    { id: "freelance", label: "Freelance" },
];

const JOB_LEVELS = [
    { id: "intern", label: "Intern" },
    { id: "fresher", label: "Fresher" },
    { id: "junior", label: "Junior" },
    { id: "middle", label: "Middle" },
    { id: "senior", label: "Senior" },
    { id: "lead", label: "Lead" },
    { id: "manager", label: "Manager" },
    { id: "director", label: "Director" },
];

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
            {children}
        </div>
    );
}

export function JobFilters() {
    const {
        category, setCategory,
        province, setProvince,
        job_type, setJobType,
        level, setLevel,
        salaryRange, setSalaryRange,
        experienceRange, setExperienceRange,
        isRemote, setIsRemote,
        skills, setSkills,
        resetFilters,
    } = useFilterStore();

    const [skillInput, setSkillInput] = useState("");
    const [showSkillDrop, setShowSkillDrop] = useState(false);

    const { data: categories } = useQuery({
        queryKey: ["job-categories"],
        queryFn: () => taxonomyService.listJobCategories(),
        staleTime: 5 * 60_000,
    });

    const { data: provinces } = useQuery({
        queryKey: ["provinces"],
        queryFn: () => taxonomyService.listProvinces(),
        staleTime: 5 * 60_000,
    });

    const { data: skillResults } = useQuery({
        queryKey: ["skills-search", skillInput],
        queryFn: () => taxonomyService.listSkills({ search: skillInput, page_size: 8 }),
        enabled: skillInput.length >= 2,
        staleTime: 30_000,
    });

    const toggleJobType = (id: string) =>
        setJobType(job_type.includes(id) ? job_type.filter(t => t !== id) : [...job_type, id]);

    const toggleLevel = (id: string) =>
        setLevel(level.includes(id) ? level.filter(l => l !== id) : [...level, id]);

    const addSkill = (name: string) => {
        if (name && !skills.includes(name)) setSkills([...skills, name]);
        setSkillInput("");
        setShowSkillDrop(false);
    };

    const removeSkill = (skill: string) => setSkills(skills.filter(s => s !== skill));

    const activeCount = [
        category && category !== "all",
        province && province !== "all",
        job_type.length,
        level.length,
        salaryRange[0] > 0 || salaryRange[1] < 10000,
        experienceRange[0] > 0 || experienceRange[1] < 15,
        isRemote,
        skills.length,
    ].filter(Boolean).length;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">Bộ lọc</span>
                    {activeCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <button onClick={resetFilters}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
                        <RotateCcw className="w-3 h-3" /> Xóa tất cả
                    </button>
                )}
            </div>

            <div className="h-px bg-gray-100" />

            {/* Lĩnh vực */}
            <FilterSection title="Lĩnh vực">
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-gray-50 border-gray-200 text-sm h-9 rounded-lg focus:ring-primary/20">
                        <SelectValue placeholder="Tất cả ngành" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                        <SelectItem value="all">Tất cả ngành</SelectItem>
                        {categories?.map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FilterSection>

            {/* Địa điểm */}
            <FilterSection title="Địa điểm">
                <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger className="w-full bg-gray-50 border-gray-200 text-sm h-9 rounded-lg focus:ring-primary/20">
                        <SelectValue placeholder="Tất cả tỉnh/thành" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-lg">
                        <SelectItem value="all">Tất cả tỉnh/thành</SelectItem>
                        {provinces?.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.province_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* Loại hình — pill buttons */}
            <FilterSection title="Loại hình">
                <div className="flex flex-wrap gap-1.5">
                    {JOB_TYPES.map(type => (
                        <button
                            key={type.id}
                            onClick={() => toggleJobType(type.id)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                job_type.includes(type.id)
                                    ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary hover:bg-primary/5"
                            )}
                        >
                            {type.label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Cấp bậc — pill buttons */}
            <FilterSection title="Cấp bậc">
                <div className="flex flex-wrap gap-1.5">
                    {JOB_LEVELS.map(l => (
                        <button
                            key={l.id}
                            onClick={() => toggleLevel(l.id)}
                            className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                level.includes(l.id)
                                    ? "bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-300/30"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50"
                            )}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* Mức lương */}
            <FilterSection title="Mức lương (USD)">
                <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-500">${salaryRange[0].toLocaleString()}</span>
                    <span className="text-primary">${salaryRange[1].toLocaleString()}</span>
                </div>
                <Slider
                    max={10000} step={100}
                    value={[salaryRange[0], salaryRange[1]]}
                    onValueChange={val => setSalaryRange(val as [number, number])}
                    className="[&_.slider-track]:bg-gray-200 [&_.slider-range]:bg-gradient-to-r [&_.slider-range]:from-primary [&_.slider-range]:to-violet-500"
                />
                <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                    <span>$0</span><span>$10,000</span>
                </div>
            </FilterSection>

            {/* Kinh nghiệm */}
            <FilterSection title="Kinh nghiệm (năm)">
                <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-500">{experienceRange[0]} năm</span>
                    <span className="text-primary">{experienceRange[1]} năm</span>
                </div>
                <Slider
                    max={15} step={1}
                    value={[experienceRange[0], experienceRange[1]]}
                    onValueChange={val => setExperienceRange(val as [number, number])}
                />
                <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                    <span>0</span><span>15+</span>
                </div>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* Remote toggle */}
            <div className="flex items-center justify-between py-0.5">
                <div className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-cyan-500" />
                    <Label htmlFor="remote-toggle" className="text-sm text-gray-700 cursor-pointer font-medium">
                        Chỉ Remote
                    </Label>
                </div>
                <Switch
                    id="remote-toggle"
                    checked={isRemote === true}
                    onCheckedChange={checked => setIsRemote(checked || null)}
                    className="data-[state=checked]:bg-cyan-500"
                />
            </div>

            <div className="h-px bg-gray-100" />

            {/* Kỹ năng */}
            <FilterSection title="Kỹ năng">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={skillInput}
                        onChange={e => { setSkillInput(e.target.value); setShowSkillDrop(true); }}
                        placeholder="Tìm kỹ năng..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        onKeyDown={e => { if (e.key === "Enter" && skillInput.trim()) addSkill(skillInput.trim()); }}
                        onBlur={() => setTimeout(() => setShowSkillDrop(false), 150)}
                    />
                    {showSkillDrop && skillResults && skillResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                            {skillResults.map((s: any) => (
                                <button key={s.id}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 hover:text-primary transition-colors"
                                    onMouseDown={() => addSkill(s.name)}>
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {skills.map(skill => (
                            <Badge key={skill} className="pl-2 pr-1 py-0.5 gap-1 bg-primary/10 text-primary border-primary/20 text-[10px] font-medium">
                                {skill}
                                <button onClick={() => removeSkill(skill)} className="hover:text-destructive ml-0.5 leading-none">
                                    <X className="h-2.5 w-2.5" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </FilterSection>
        </div>
    );
}
