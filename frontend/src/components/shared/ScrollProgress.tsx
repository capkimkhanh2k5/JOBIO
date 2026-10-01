import { useScroll, motion } from 'framer-motion';

/**
 * Thin scroll progress indicator bar at the very top of the page.
 * Uses teal-to-gold brand gradient from Editorial Luxury design system.
 */
export function ScrollProgress() {
    const { scrollYProgress } = useScroll();

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-[2px] z-[9999] origin-left bg-gradient-to-r from-[var(--brand-teal)] via-[var(--brand-teal-light)] to-[var(--brand-gold)]"
            style={{ scaleX: scrollYProgress }}
        />
    );
}
