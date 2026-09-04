import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, ShieldCheck, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'success' | 'warning' | 'info';
    isLoading?: boolean;
    className?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Xác nhận",
    cancelText = "Hủy bỏ",
    type = 'info',
    isLoading = false,
    className = ''
}) => {
    // Prevent body scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (typeof window === 'undefined') return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <ShieldAlert className="w-5 h-5" />,
                    iconBg: 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400',
                    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20',
                };
            case 'success':
                return {
                    icon: <ShieldCheck className="w-5 h-5" />,
                    iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                    buttonBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20',
                };
            case 'warning':
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    iconBg: 'bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400',
                    buttonBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/25',
                };
            default:
                return {
                    icon: <Info className="w-5 h-5" />,
                    iconBg: 'bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400',
                    buttonBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/25',
                };
        }
    };

    const styles = getTypeStyles();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Dark Blurred Backdrop Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Centered Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 15 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className={`relative z-10 bg-card rounded-3xl border border-border/80 shadow-2xl shadow-black/25 w-full max-w-[420px] p-6 overflow-hidden ${className}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors"
                            aria-label="Đóng"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </button>

                        <div className="flex items-start gap-3.5 mb-2">
                            <div className={`w-10 h-10 rounded-2xl ${styles.iconBg} flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                                {styles.icon}
                            </div>
                            <div className="flex-1 pr-6">
                                <h3 className="text-base font-bold text-foreground leading-snug">{title}</h3>
                                <p className="text-xs text-muted-foreground font-medium mt-1.5 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isLoading}
                                onClick={onClose}
                                className="w-full h-11 rounded-2xl border-border bg-muted/50 font-bold text-sm text-foreground/80 hover:bg-muted transition-all"
                            >
                                {cancelText}
                            </Button>
                            <Button
                                type="button"
                                disabled={isLoading}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onConfirm();
                                }}
                                className={`w-full h-11 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] text-white shadow-md ${styles.buttonBg}`}
                            >
                                {isLoading ? "Đang xử lý..." : confirmText}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
