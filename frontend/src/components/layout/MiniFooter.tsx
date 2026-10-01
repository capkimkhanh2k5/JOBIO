import { Link } from 'react-router-dom';

/**
 * A minimal footer designed for Dashboards and Admin Portals.
 * Provides copyright info and essential links without cluttering the data-dense workspace.
 * Follows the Editorial Luxury design system with warm teal accents.
 */
export function MiniFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-border/40 bg-background/95 backdrop-blur-sm py-4 px-6 dark:bg-card/80 dark:border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-slate-800 font-semibold dark:text-white/90">© {currentYear} JOBIO</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="text-muted-foreground">Bản quyền thuộc về JOBIO.</span>
                </div>

                <nav className="flex items-center gap-5">
                    <Link
                        to="/faq"
                        className="hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Trợ giúp
                    </Link>
                    <Link
                        to="/contact"
                        className="hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Liên hệ
                    </Link>
                    <Link
                        to="/about"
                        className="hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Về chúng tôi
                    </Link>
                    <Link
                        to="/terms"
                        className="hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Điều khoản
                    </Link>
                    <Link
                        to="/privacy"
                        className="hover:text-primary transition-colors duration-200 font-medium"
                    >
                        Bảo mật
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
