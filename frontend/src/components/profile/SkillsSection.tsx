import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Award, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '../../services/mockApi';
import { SectionWrapper } from './SectionWrapper';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const SkillsSection = ({ userId }: { userId: string }) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    const { data: skills = [], isLoading } = useQuery({
        queryKey: ['skills', userId],
        queryFn: () => mockApi.getSkills(userId),
    });

    const { data: searchResults = [] } = useQuery({
        queryKey: ['skills-search', searchValue],
        queryFn: () => mockApi.searchSkills(searchValue),
        enabled: searchValue.length > 0
    });

    if (isLoading) return <div>Đang tải...</div>;

    return (
        <SectionWrapper title="Kỹ năng" id="skills">
            <div className="space-y-8">
                <div className="flex flex-wrap gap-4">
                    {skills.map((skill: any) => (
                        <motion.div
                            key={skill.id}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            whileHover={{ scale: 1.05 }}
                            className="glass-effect p-4 py-3 rounded-2xl flex items-center gap-3 group relative overflow-hidden"
                        >
                            {skill.is_verified && (
                                <div className="absolute top-0 right-0 p-1 bg-emerald-500/20 rounded-bl-lg">
                                    <Award className="w-3 h-3 text-emerald-500" />
                                </div>
                            )}

                            <div>
                                <h4 className="font-bold text-sm">{skill.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-[10px] px-2 py-0 h-4 capitalize">
                                        {skill.proficiency_level}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">{skill.years_of_experience} năm</span>
                                </div>
                            </div>

                            <button className="p-1 hover:text-destructive transition-colors ml-2">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}

                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="h-[52px] px-6 rounded-2xl border-dashed border-2">
                                <Plus className="w-5 h-5 mr-2" />
                                Thêm kỹ năng
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0 rounded-2xl overflow-hidden glass-effect" align="start">
                            <Command className="bg-transparent">
                                <CommandInput
                                    placeholder="Tìm kỹ năng (React, Python...)"
                                    onValueChange={setSearchValue}
                                />
                                <CommandList>
                                    <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
                                    <CommandGroup>
                                        {searchResults.map((s: string) => (
                                            <CommandItem
                                                key={s}
                                                onSelect={() => {
                                                    setOpen(false);
                                                    setSearchValue("");
                                                }}
                                                className="cursor-pointer hover:bg-primary/10"
                                            >
                                                {s}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Skill Tips */}
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex gap-4 items-start">
                    <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <div>
                        <h5 className="font-bold text-sm text-primary">Mẹo cho bạn</h5>
                        <p className="text-xs text-muted-foreground mt-1">
                            Các kỹ năng có chứng chỉ <strong>Expert</strong> hoặc đã được <strong>Xác thực</strong> sẽ giúp hồ sơ của bạn nổi bật hơn 40% trong mắt nhà tuyển dụng.
                        </p>
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};
