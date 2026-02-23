import { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { Plus, GripVertical, Trash2, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/services/mockApi';
import { SectionWrapper } from './SectionWrapper';
import { formatDate } from '@/lib/utils';

export const ExperienceSection = ({ userId }: { userId: string }) => {
    const { data: experiences = [], isLoading } = useQuery({
        queryKey: ['experience', userId],
        queryFn: () => mockApi.getExperience(userId),
    });

    const [items, setItems] = useState<any[]>(experiences);

    // Sync items when data loads
    useEffect(() => {
        if (experiences.length > 0) setItems(experiences);
    }, [experiences]);

    const handleReorder = (newOrder: any[]) => {
        setItems(newOrder);
        // Mutation for reorder would go here
    };

    if (isLoading) return <div>Đang tải...</div>;

    return (
        <SectionWrapper title="Kinh nghiệm làm việc" id="experience">
            <div className="space-y-6">
                <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
                    {items.map((exp) => (
                        <Reorder.Item
                            key={exp.id}
                            value={exp}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="glass-effect p-6 rounded-2xl flex gap-4 items-start group select-none"
                        >
                            <div className="mt-1 text-muted-foreground cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{exp.job_title}</h3>
                                        <p className="text-primary font-medium flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            {exp.company_name}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(exp.start_date)} - {exp.is_current ? "Hiện tại" : formatDate(exp.end_date)}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-4 h-4" />
                                        {exp.location}
                                    </div>
                                </div>

                                {exp.description && (
                                    <p className="text-sm text-muted-foreground mt-3 line-clamp-3 leading-relaxed">
                                        {exp.description}
                                    </p>
                                )}
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                <Button variant="outline" className="w-full h-12 dashed-border border-2 border-dashed rounded-2xl hover:bg-primary/5 hover:border-primary transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm kinh nghiệm
                </Button>
            </div>
        </SectionWrapper>
    );
};
