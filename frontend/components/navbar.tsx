"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogoIcon } from "@/components/logo-icon"
import { ConnectButton } from "@mysten/dapp-kit"
import "@mysten/dapp-kit/dist/index.css";

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="w-full border-b border-slate-800 backdrop-blur-md bg-slate-900/80 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <LogoIcon className="h-8 w-8" />
            <span className="font-tomorrow text-xl tracking-tight">DeepLever</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/borrow"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/borrow" ? "text-primary" : "text-slate-300",
              )}
            >
              Borrow
            </Link>
            <Link
              href="/lend"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/lend" ? "text-primary" : "text-slate-300",
              )}
            >
              Lend
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {/* <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-slate-700 hover:bg-slate-800 hover:text-primary"
          >
            Connect Wallet
          </Button> */}
          <ConnectButton />
          <Button size="sm" className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90">
            Launch App
          </Button>
        </div>
      </div>
    </header>
  )
}
