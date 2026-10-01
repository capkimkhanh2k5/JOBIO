import * as React from "react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            closeButton
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg relative group-hover:[&_[data-close-button]]:opacity-100",
                    description: "group-[.toast]:text-muted-foreground",
                    actionButton:
                        "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton:
                        "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                    closeButton:
                        "opacity-0 group-hover:opacity-100 transition-opacity !left-auto !right-2.5 !top-2.5 !bg-muted hover:!bg-red-50 hover:!text-red-600 dark:hover:!bg-red-950/50 !border-border cursor-pointer !transform-none",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
