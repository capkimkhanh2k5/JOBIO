export const AuroraBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-background select-none">
            {/* Dynamic Aurora Orbs — warm teal/gold/emerald spectrum */}
            <div className="absolute top-[-15%] left-[-15%] w-[90vw] h-[90vw] rounded-full bg-[var(--brand-teal-light)]/30 blur-[130px] aurora-orb" />
            <div className="absolute top-[15%] right-[-15%] w-[80vw] h-[80vw] rounded-full bg-[var(--brand-teal)]/25 blur-[140px] aurora-orb" style={{ animationDelay: '3s', animationDuration: '20s' }} />
            <div className="absolute bottom-[-15%] left-[15%] w-[100vw] h-[100vw] rounded-full bg-[var(--brand-gold)]/15 blur-[160px] aurora-orb" style={{ animationDelay: '6s', animationDuration: '25s' }} />

            {/* Pulsing focal points — warm gold accent */}
            <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-primary/15 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute bottom-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-[var(--brand-gold-light)]/15 blur-[90px] animate-pulse" style={{ animationDuration: '8s' }} />

            {/* Fine Noise Grain */}
            <div className="absolute inset-0 noise-texture opacity-50" />
        </div>
    );
};
