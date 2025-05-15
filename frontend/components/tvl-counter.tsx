"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function TVLCounter({ className }: { className?: string }) {
  const [tvl, setTvl] = useState(12500000)

  // Simulate fetching TVL from Sui RPC
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate small changes in TVL
      const change = Math.random() * 10000 - 5000
      setTvl((prev) => Math.max(10000000, prev + change))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="text-sm font-medium text-slate-400 mb-2">Total Value Locked</div>
      <div className="font-tomorrow text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF]">
        ${tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div className="text-xs text-slate-500 mt-2">Live from Sui blockchain</div>
    </div>
  )
}
