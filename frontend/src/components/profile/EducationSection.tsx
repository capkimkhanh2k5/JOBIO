import { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { Plus, GripVertical, Trash2, Calendar, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { mockApi } from '@/services/mockApi';
import { SectionWrapper } from './SectionWrapper';
import { formatDate } from '@/lib/utils';

export const EducationSection = ({ userId }: { userId: string }) => {
    const { data: educations = [], isLoading } = useQuery({
        queryKey: ['education', userId],
        queryFn: () => mockApi.getEducation(userId),
    });

    const [items, setItems] = useState<any[]>(educations);

    useEffect(() => {
        if (educations.length > 0) setItems(educations);
    }, [educations]);

    const handleReorder = (newOrder: any[]) => {
        setItems(newOrder);
    };

    if (isLoading) return <div>Đang tải...</div>;

    return (
        <SectionWrapper title="Học vấn" id="education">
            <div className="space-y-6">
                <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="space-y-4">
                    {items.map((edu) => (
                        <Reorder.Item
                            key={edu.id}
                            value={edu}
                            className="glass-effect p-6 rounded-2xl flex gap-4 items-start group select-none"
                        >
                            <div className="mt-1 text-muted-foreground cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{edu.school_name}</h3>
                                        <p className="text-primary font-medium flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            {edu.degree} in {edu.field_of_study}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(edu.start_date)} - {edu.is_current ? "Hiện tại" : formatDate(edu.end_date)}
                                    {edu.gpa && <span className="ml-4 font-medium text-emerald-500">GPA: {edu.gpa}</span>}
                                </div>

                                {edu.description && (
                                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed italic">
                                        "{edu.description}"
                                    </p>
                                )}
                            </div>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>

                <Button variant="outline" className="w-full h-12 dashed-border border-2 border-dashed rounded-2xl hover:bg-primary/5 hover:border-primary transition-all">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm học vấn
                </Button>
            </div>
        </SectionWrapper>
    );
};
