import { useFilterStore } from "@/store/useStore";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { motion } from "framer-motion";

const JOB_TYPES = [
    { id: "full_time", label: "Full-time" },
    { id: "part_time", label: "Part-time" },
    { id: "contract", label: "Contract" },
    { id: "internship", label: "Internship" },
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
        resetFilters
    } = useFilterStore();

    const toggleJobType = (id: string) => {
        if (job_type.includes(id)) {
            setJobType(job_type.filter(t => t !== id));
        } else {
            setJobType([...job_type, id]);
        }
    };

    const toggleLevel = (id: string) => {
        if (level.includes(id)) {
            setLevel(level.filter(l => l !== id));
        } else {
            setLevel([...level, id]);
        }
    };

    const removeSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Bộ lọc</h3>
                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary h-8 px-2">
                    Xóa tất cả
                </Button>
            </div>

            <Separator />

            {/* Industry/Category */}
            <div className="space-y-3">
                <Label>Ngành nghề</Label>
                <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full bg-background/80 backdrop-blur-sm border-white/20">
                        <SelectValue placeholder="Chọn ngành nghề" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả ngành nghề</SelectItem>
                        <SelectItem value="it-software">IT - Phần mềm</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="design">Design / Creative</SelectItem>
                        <SelectItem value="finance">Tài chính / Kế toán</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="space-y-3">
                <Label>Địa điểm</Label>
                <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger className="w-full bg-background/80 backdrop-blur-sm border-white/20">
                        <SelectValue placeholder="Chọn địa điểm" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tất cả địa điểm</SelectItem>
                        <SelectItem value="Hồ Chí Minh">TP. Hồ Chí Minh</SelectItem>
                        <SelectItem value="Hà Nội">Hà Nội</SelectItem>
                        <SelectItem value="Đà Nẵng">Đà Nẵng</SelectItem>
                        <SelectItem value="Remote">Làm việc từ xa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Job Type */}
            <div className="space-y-3">
                <Label>Loại hình</Label>
                <div className="grid grid-cols-1 gap-2">
                    {JOB_TYPES.map((type) => (
                        <div key={type.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`type-${type.id}`}
                                checked={job_type.includes(type.id)}
                                onCheckedChange={() => toggleJobType(type.id)}
                            />
                            <label htmlFor={`type-${type.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                {type.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Level */}
            <div className="space-y-3">
                <Label>Cấp bậc</Label>
                <div className="grid grid-cols-2 gap-2">
                    {JOB_LEVELS.map((l) => (
                        <div key={l.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`level-${l.id}`}
                                checked={level.includes(l.id)}
                                onCheckedChange={() => toggleLevel(l.id)}
                            />
                            <label htmlFor={`level-${l.id}`} className="text-sm font-medium leading-none cursor-pointer">
                                {l.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Salary Range */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>Mức lương (USD)</Label>
                    <span className="text-xs font-mono text-primary">${salaryRange[0]} - ${salaryRange[1]}</span>
                </div>
                <Slider
                    defaultValue={[0, 10000]}
                    max={10000}
                    step={100}
                    value={[salaryRange[0], salaryRange[1]]}
                    onValueChange={(val) => setSalaryRange(val as [number, number])}
                    className="py-4"
                />
            </div>

            {/* Experience */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <Label>Kinh nghiệm (năm)</Label>
                    <span className="text-xs font-mono text-primary">{experienceRange[0]} - {experienceRange[1]}y</span>
                </div>
                <Slider
                    defaultValue={[0, 15]}
                    max={15}
                    step={1}
                    value={[experienceRange[0], experienceRange[1]]}
                    onValueChange={(val) => setExperienceRange(val as [number, number])}
                    className="py-4"
                />
            </div>

            <Separator />

            {/* Remote Toggle */}
            <div className="flex items-center justify-between">
                <Label htmlFor="remote-toggle">Chỉ việc làm Remote</Label>
                <Switch
                    id="remote-toggle"
                    checked={isRemote === true}
                    onCheckedChange={(checked) => setIsRemote(checked || null)}
                />
            </div>

            {/* Skill Tags */}
            <div className="space-y-3">
                <Label>Kỹ năng</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Tìm kỹ năng..."
                        className="w-full bg-background/50 border border-white/10 rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const val = e.currentTarget.value.trim();
                                if (val && !skills.includes(val)) {
                                    setSkills([...skills, val]);
                                    e.currentTarget.value = '';
                                }
                            }
                        }}
                    />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 bg-primary/10 hover:bg-primary/20 border-primary/20">
                            {skill}
                            <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}
