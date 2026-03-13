import { Link } from 'react-router-dom';

/**
 * A minimal footer designed for Dashboards and Admin Portals.
 * Provides copyright info and essential links without cluttering the data-dense workspace.
 */
export function MiniFooter() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-auto border-t border-slate-200 bg-slate-50/50 py-4 px-6 dark:bg-slate-900/50 dark:border-slate-800">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 font-medium">
                    <span className="text-slate-600 dark:text-slate-300">© {currentYear} JobPortal</span>
                    <span>·</span>
                    <span>All rights reserved.</span>
                </div>

                <nav className="flex items-center gap-6">
                    <Link
                        to="/faq"
                        className="hover:text-primary transition-colors duration-200"
                    >
                        Trợ giúp
                    </Link>
                    <Link
                        to="/contact"
                        className="hover:text-primary transition-colors duration-200"
                    >
                        Liên hệ
                    </Link>
                    <Link
                        to="/about"
                        className="hover:text-primary transition-colors duration-200"
                    >
                        Về chúng tôi
                    </Link>
                    <Link
                        to="/terms"
                        className="hover:text-primary transition-colors duration-200"
                    >
                        Điều khoản
                    </Link>
                    <Link
                        to="/privacy"
                        className="hover:text-primary transition-colors duration-200"
                    >
                        Bảo mật
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
