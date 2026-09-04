import { Link } from 'react-router-dom';

/**
 * A minimal footer designed for Dashboards and Admin Portals.
 * Provides copyright info and essential links without cluttering the data-dense workspace.
 * Follows the Editorial Luxury design system with warm teal accents.
 */
export function MiniFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-border/60 bg-[var(--brand-warm-surface)]/50 py-4 px-6 dark:bg-[oklch(0.06_0.025_175)]/50 dark:border-white/8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/60">
                <div className="flex items-center gap-1.5 font-medium">
                    <span className="text-foreground/70 dark:text-white/50">© {currentYear} JOBIO</span>
                    <span className="text-border">·</span>
                    <span>Bản quyền thuộc về JOBIO.</span>
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
