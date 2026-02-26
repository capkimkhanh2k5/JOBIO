import { useScroll, motion } from 'framer-motion';

/**
 * Thin scroll progress indicator bar at the very top of the page.
 * Uses Framer Motion's useScroll for performance.
 */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] z-[9999] origin-left bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-400"
            style={{ scaleX: scrollYProgress }}
        />
    );
}
