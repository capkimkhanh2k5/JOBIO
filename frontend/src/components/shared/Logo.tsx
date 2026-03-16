import { Link } from 'react-router-dom';

interface LogoProps {
    className?: string;
    imageClassName?: string;
    textClassName?: string;
    showText?: boolean;
    to?: string;
}

export const Logo = ({ 
    className = "", 
    imageClassName = "h-10 w-auto object-contain", 
    textClassName = "text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-500 tracking-tighter",
    showText = true,
    to = "/"
}: LogoProps) => {
    const logoUrl = import.meta.env.VITE_SYSTEM_LOGO_URL;

    const content = (
        <div className={`flex items-center gap-3 ${className}`}>
            {logoUrl ? (
                <img 
                    src={logoUrl} 
                    alt="Jobio Logo" 
                    className={imageClassName}
                    onError={(e) => {
                        // Fallback to text if image fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                        const textEl = (e.target as HTMLImageElement).nextElementSibling;
                        if (textEl) {
                            (textEl as HTMLElement).style.display = 'block';
                        }
                    }}
                />
            ) : null}
            
            {/* Show text if no logoUrl, or as fallback on image error */}
            <span 
                className={textClassName}
                style={{ display: logoUrl ? 'none' : 'block' }}
            >
                {showText ? "JOBIO" : ""}
            </span>
        </div>
    );

    if (to) {
        return (
            <Link to={to} className="hover:opacity-80 transition-opacity">
                {content}
            </Link>
        );
    }

    return content;
};
