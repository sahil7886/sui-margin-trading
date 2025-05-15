import type React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function GlassCard({ children, className, title }: GlassCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden",
        className,
      )}
    >
      {title && <div className="px-4 py-3 border-b border-slate-700/50 font-medium">{title}</div>}
      <div className="p-4">{children}</div>
    </div>
  )
}
