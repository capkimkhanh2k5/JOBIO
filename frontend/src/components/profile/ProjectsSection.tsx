import React from 'react';
import { Plus, Trash2, FolderGit2, ExternalLink, Github } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { SectionWrapper } from './SectionWrapper';

export const ProjectsSection = ({ userId }: { userId: string }) => {
    const projects = [
        {
            id: "p1",
            project_name: "JOBIO Recruitment Platform",
            description: "Nền tảng tuyển dụng hiện đại với Neo-glass UI và Aurora gradients.",
            project_url: "https://jobio.dev",
            github_url: "https://github.com/anv/jobio",
            technologies_used: ["React", "TypeScript", "Tailwind", "Framer Motion"],
            is_ongoing: true
        }
    ];

    return (
        <SectionWrapper title="Dự án cá nhân" id="projects">
            <div className="space-y-6">
                {projects.map((project) => (
                    <div key={project.id} className="glass-effect p-6 rounded-2xl group relative overflow-hidden">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-32 h-24 bg-primary/10 rounded-xl flex items-center justify-center">
                                <FolderGit2 className="w-10 h-10 text-primary/30" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{project.project_name}</h3>
                                        {project.is_ongoing && <Badge variant="outline" className="text-[10px] mt-1 text-emerald-500 border-emerald-500/20">Đang thực hiện</Badge>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">{project.description}</p>
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {project.technologies_used.map(tech => (
                                        <Badge key={tech} variant="secondary" className="text-[10px] bg-background/50">{tech}</Badge>
                                    ))}
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <a href={project.project_url} className="text-xs flex items-center gap-1 font-bold text-primary">
                                        <ExternalLink className="w-3 h-3" /> Live Demo
                                    </a>
                                    <a href={project.github_url} className="text-xs flex items-center gap-1 font-bold text-muted-foreground hover:text-foreground">
                                        <Github className="w-3 h-3" /> GitHub
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="w-full h-12 border-dashed border-2 rounded-2xl">
                    <Plus className="w-5 h-5 mr-2" />
                    Thêm dự án mới
                </Button>
            </div>
        </SectionWrapper>
    );
};
