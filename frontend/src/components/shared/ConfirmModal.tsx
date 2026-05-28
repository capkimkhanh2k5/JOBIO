import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <ShieldAlert className="w-5 h-5" />,
                    iconBg: 'bg-red-50',
                    iconColor: 'text-red-600',
                    buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-100',
                };
            case 'success':
                return {
                    icon: <ShieldCheck className="w-5 h-5" />,
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
                };
            case 'warning':
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-600',
                    buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
                };
            default:
                return {
                    icon: <Info className="w-5 h-5" />,
                    iconBg: 'bg-slate-50',
                    iconColor: 'text-slate-600',
                    buttonBg: 'bg-slate-900 hover:bg-slate-800 shadow-slate-100',
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent
                className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] z-50 border-none bg-transparent shadow-none p-0 w-full max-w-[400px] data-[state=open]:animate-none data-[state=closed]:animate-none"
            >
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                            exit={{ opacity: 0, scale: 0.5, x: "-50%", y: "-50%" }}
                            transition={{
                                type: "spring",
                                damping: 25,
                                stiffness: 450,
                            }}
                            style={{
                                position: 'fixed',
                                left: '50%',
                                top: '50%',
                            }}
                            className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl w-full max-w-[400px] font-['Plus_Jakarta_Sans','Inter',sans-serif] ${className}`}
                        >
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-black text-slate-900 flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center ${styles.iconColor} shrink-0`}>
                                        {styles.icon}
                                    </div>
                                    {title}
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-medium pt-2 leading-relaxed">
                                    {description}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="pt-6 gap-2">
                                <AlertDialogCancel
                                    disabled={isLoading}
                                    className="rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 h-11 px-6 transition-all"
                                >
                                    {cancelText}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onConfirm();
                                    }}
                                    disabled={isLoading}
                                    className={`rounded-xl font-bold h-11 px-8 shadow-lg transition-all active:scale-95 text-white ${styles.buttonBg}`}
                                >
                                    {isLoading ? "Đang xử lý..." : confirmText}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AlertDialogContent>
        </AlertDialog>
    );
};
