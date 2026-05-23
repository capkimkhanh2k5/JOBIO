import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) return undefined

                    if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
                        return "vendor-react"
                    }

                    if (/[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) {
                        return "vendor-router"
                    }

                    if (id.includes(`${path.sep}node_modules${path.sep}@tanstack${path.sep}`)) {
                        return "vendor-query"
                    }

                    if (
                        id.includes(`${path.sep}node_modules${path.sep}@radix-ui${path.sep}`) ||
                        id.includes(`${path.sep}node_modules${path.sep}@floating-ui${path.sep}`) ||
                        /[\\/]node_modules[\\/](aria-hidden|react-remove-scroll|react-style-singleton|use-callback-ref|use-sidecar)[\\/]/.test(id)
                    ) {
                        return "vendor-radix"
                    }

                    if (/[\\/]node_modules[\\/](lucide-react)[\\/]/.test(id)) {
                        return "vendor-icons"
                    }

                    if (/[\\/]node_modules[\\/](framer-motion|@studio-freight|lenis)[\\/]/.test(id)) {
                        return "vendor-motion"
                    }

                    if (/[\\/]node_modules[\\/](recharts|victory-vendor|d3-[^\\/]+)[\\/]/.test(id)) {
                        return "vendor-charts"
                    }

                    if (id.includes(`${path.sep}node_modules${path.sep}@tiptap${path.sep}`)) {
                        return "vendor-editor"
                    }

                    if (/[\\/]node_modules[\\/](gsap)[\\/]/.test(id)) {
                        return "vendor-animation"
                    }

                    if (/[\\/]node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/.test(id)) {
                        return "vendor-forms"
                    }

                    if (/[\\/]node_modules[\\/](axios|jwt-decode|date-fns|zustand)[\\/]/.test(id)) {
                        return "vendor-utils"
                    }

                    return undefined
                },
            },
        },
    },
})
