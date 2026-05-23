export const AuroraBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-50 bg-[#f8f9fa] dark:bg-background select-none">
            {/* Dynamic Aurora Orbs - Higher Opacity & Vibrant Colors */}
            <div className="absolute top-[-15%] left-[-15%] w-[90vw] h-[90vw] rounded-full bg-cyan-400/40 blur-[130px] aurora-orb" />
            <div className="absolute top-[15%] right-[-15%] w-[80vw] h-[80vw] rounded-full bg-violet-600/35 blur-[140px] aurora-orb" style={{ animationDelay: '3s', animationDuration: '20s' }} />
            <div className="absolute bottom-[-15%] left-[15%] w-[100vw] h-[100vw] rounded-full bg-blue-500/30 blur-[160px] aurora-orb" style={{ animationDelay: '6s', animationDuration: '25s' }} />

            {/* Pulsing focal points for extra 'pop' */}
            <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
            <div className="absolute bottom-[30%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-cyan-300/20 blur-[90px] animate-pulse" style={{ animationDuration: '8s' }} />

            {/* Fine Noise Grain - slightly stronger for texture */}
            <div className="absolute inset-0 opacity-[0.04] contrast-125 brightness-110"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}>
            </div>
        </div>
    );
};
