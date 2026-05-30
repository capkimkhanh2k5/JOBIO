import { getSkillIconClass, getFallbackColor } from '@/lib/skillIconMap';

interface SkillIconProps {
  skillName: string;
  /** Pixel size for the icon container (default 28) */
  size?: number;
  /** Extra Tailwind classes on the wrapper */
  className?: string;
}

/**
 * Renders a technology icon from Devicon when available,
 * or a styled initial-letter badge as fallback.
 */
export function SkillIcon({ skillName, size = 28, className = '' }: SkillIconProps) {
  const iconClass = getSkillIconClass(skillName);
  const iconFontSize = Math.round(size * 0.57);

  if (iconClass) {
    return (
      <span
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <i className={iconClass} style={{ fontSize: iconFontSize }} />
      </span>
    );
  }

  // Fallback: first letter with a deterministic color
  const color = getFallbackColor(skillName);
  const initial = (skillName[0] || '?').toUpperCase();
  const fontSize = Math.round(size * 0.42);

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 rounded-lg font-bold select-none ${color.bg} ${color.text} ${className}`}
      style={{ width: size, height: size, fontSize }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
