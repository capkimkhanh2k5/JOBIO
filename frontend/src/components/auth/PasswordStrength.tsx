import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
    password?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
    const calculateStrength = (pwd: string) => {
        let strength = 0;
        if (pwd.length >= 8) strength += 25;
        if (/[A-Z]/.test(pwd)) strength += 25;
        if (/[0-9]/.test(pwd)) strength += 25;
        if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;
        return strength;
    };

    const strength = calculateStrength(password);

    const getStrengthColor = (val: number) => {
        if (val <= 25) return "bg-red-500";
        if (val <= 50) return "bg-orange-500";
        if (val <= 75) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthLabel = (val: number) => {
        if (val === 0) return "";
        if (val <= 25) return "Yếu";
        if (val <= 50) return "Trung bình";
        if (val <= 75) return "Mạnh";
        return "Rất mạnh";
    };

    if (!password) return null;

    return (
        <div className="space-y-2 mt-2">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60">
                <span>Độ mạnh mật khẩu</span>
                <span className={cn("text-xs transition-colors",
                    strength <= 25 ? "text-red-400" :
                        strength <= 50 ? "text-orange-400" :
                            strength <= 75 ? "text-yellow-400" : "text-green-400"
                )}>
                    {getStrengthLabel(strength)}
                </span>
            </div>
            <Progress
                value={strength}
                className="h-1 bg-white/5"
                indicatorClassName={cn("transition-all duration-500", getStrengthColor(strength))}
            />
            <div className="grid grid-cols-4 gap-1 h-1 mt-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn("h-full rounded-full transition-colors",
                            strength >= i * 25 ? getStrengthColor(strength) : "bg-white/5"
                        )}
                    />
                ))}
            </div>
        </div>
    );
};
