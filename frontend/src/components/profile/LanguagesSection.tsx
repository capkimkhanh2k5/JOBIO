import React from 'react';
import { Plus, Trash2, Languages as LangIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SectionWrapper } from './SectionWrapper';

export const LanguagesSection = ({ userId }: { userId: string }) => {
    const languages = [
        { id: "l1", name: "Tiếng Việt", proficiency_level: "Native", is_native: true },
        { id: "l2", name: "Tiếng Anh", proficiency_level: "Fluent", is_native: false }
    ];

    return (
        <SectionWrapper title="Ngoại ngữ" id="languages">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languages.map((lang) => (
                    <div key={lang.id} className="glass-effect p-5 rounded-2xl flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <LangIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold">{lang.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{lang.proficiency_level}</span>
                                    {lang.is_native && <Badge className="text-[9px] h-3.5 px-1 bg-emerald-500/20 text-emerald-500 border-none">Bản ngữ</Badge>}
                                </div>
                            </div>
                        </div>
                        <button className="p-2 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <div className="glass-effect border-dashed border-2 p-5 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-primary/5 transition-colors">
                    <Plus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground">Thêm ngoại ngữ</span>
                </div>
            </div>
        </SectionWrapper>
    );
};
