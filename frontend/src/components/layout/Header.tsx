import { Link, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/uiStore';
import { Search, Menu, Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { useState, useEffect } from 'react';

export const Header = () => {
    const toggleCommand = useUiStore((state) => state.toggleCommand);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 z-50 w-full transition-all duration-700 ${isScrolled ? 'py-4' : 'py-8'}`}>
            <div className="container mx-auto px-4">
                <div className={`flex items-center justify-between px-10 h-20 rounded-[32px] transition-all duration-700 ${isScrolled ? 'glass-effect shadow-2xl scale-[1.02]' : 'bg-transparent border-transparent'}`}>
                    <div className="flex items-center gap-16">
                        <Link to="/" className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter hover:opacity-80 transition-opacity">
                            JOBIO
                        </Link>

                        <nav className="hidden lg:flex items-center gap-10">
                            {[
                                { name: 'Browse Jobs', path: '/jobs' },
                                { name: 'Companies', path: '/companies' },
                                { name: 'Post a Job', path: '/employer/register' }
                            ].map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`text-[15px] font-black uppercase tracking-widest transition-all hover:text-primary ${location.pathname === item.path ? 'text-primary' : 'text-foreground/60'}`}
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleCommand}
                            className="rounded-full w-12 h-12 hover:bg-primary/10 transition-colors magnetic-button"
                        >
                            <Search className="w-6 h-6" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-12 h-12 relative magnetic-button"
                        >
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                        </Button>

                        <div className="h-6 w-[1px] bg-border/40 mx-2" />

                        <Button className="rounded-full px-8 h-12 font-black text-[15px] bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 magnetic-button">
                            Join Now
                        </Button>

                        <Button variant="ghost" size="icon" className="lg:hidden rounded-full w-12 h-12">
                            <Menu className="w-7 h-7" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};
