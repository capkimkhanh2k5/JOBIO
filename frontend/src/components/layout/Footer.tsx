import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Github } from 'lucide-react';
import { Button } from '../ui/button';

export const Footer = () => (
    <footer className="relative mt-44 border-t border-border/30 glass-effect overflow-hidden bg-background/50">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="container mx-auto px-4 py-32 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20">
                <div className="lg:col-span-2 space-y-12">
                    <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter">
                        JOBIO
                    </div>
                    <p className="text-xl text-muted-foreground font-medium max-w-sm leading-relaxed">
                        The ultimate ecosystem for world-class talent and disruptive organizations. Built for the future of work.
                    </p>
                    <div className="flex gap-6">
                        {[Facebook, Twitter, Linkedin, Instagram, Github].map((Icon, i) => (
                            <Button key={i} variant="ghost" size="icon" className="rounded-2xl w-14 h-14 glass-effect hover:bg-primary hover:text-white transition-all magnetic-button shadow-sm">
                                <Icon className="w-7 h-7" />
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-16 lg:col-span-3">
                    {[
                        { title: 'Ecosystem', links: ['Browse Jobs', 'Companies', 'Salaries', 'Career Advice'] },
                        { title: 'Partners', links: ['Post a Role', 'HR Solutions', 'Corporate Branding', 'Sales'] },
                        { title: 'Governance', links: ['Support Desk', 'Safety First', 'Terms of Use', 'Privacy Policy'] },
                    ].map((section) => (
                        <div key={section.title} className="space-y-10">
                            <h4 className="text-[12px] font-black uppercase tracking-[0.4em] text-foreground/30">{section.title}</h4>
                            <ul className="space-y-6">
                                {section.links.map((link) => (
                                    <li key={link}>
                                        <Link to="#" className="text-[16px] font-bold text-muted-foreground/80 hover:text-primary transition-colors">{link}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-40 pt-16 border-t border-border/20 flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="text-[14px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                    © 2024 JOBIO GLOBAL INC. ALL RIGHTS RESERVED.
                </div>
                <div className="flex gap-10 text-[12px] font-black uppercase tracking-widest text-muted-foreground/30">
                    <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
                    <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                    <Link to="/cookies" className="hover:text-primary transition-colors">Digital Cookies</Link>
                </div>
            </div>
        </div>
    </footer>
);
