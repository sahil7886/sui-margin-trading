import Image from "next/image"
import { LogoIcon } from "@/components/logo-icon"

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800 bg-slate-900/80 py-6">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="h-5 w-5" />
            <span className="font-tomorrow text-sm">DeepLever</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <div className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full">Audited</div>
              <div className="bg-blue-500/20 text-blue-500 text-xs px-2 py-0.5 rounded-full">Verified</div>
            </div>

            <div className="flex items-center gap-4">
              {/* Original Next.js Image component for Pyth logo commented out for testing */}
              {/* <Image
                src="/logos/pyth-logo.svg"
                alt="Pyth Network"
                width={24}
                height={24}
                className="opacity-70 hover:opacity-100 transition-opacity"
              /> */}
              <img
                src="/logos/pyth-logo.svg"
                alt="Pyth Network"
                width={24}
                height={24}
                className="opacity-70 hover:opacity-100 transition-opacity"
                style={{ width: '24px', height: '24px' }} // Added inline style for explicit sizing
              />
              {/* <Image
                src="/logos/deepbook-logo.svg"
                alt="DeepBook"
                width={24}
                height={24}
                className="opacity-70 hover:opacity-100 transition-opacity"
              /> */}
              {/* Original Next.js Image component for Sui logo commented out for testing */}
              {/* <Image
                src="/logos/sui-logo.svg"
                alt="Sui Blockchain"
                width={24}
                height={24}
                className="opacity-70 hover:opacity-100 transition-opacity"
              /> */}
              <img
                src="/logos/sui-logo.svg"
                alt="Sui Blockchain"
                width={24}
                height={24}
                className="opacity-70 hover:opacity-100 transition-opacity"
                style={{ width: '24px', height: '24px' }} // Added inline style for explicit sizing
              />
            </div>
          </div>

          <div className="text-xs text-slate-400">© {new Date().getFullYear()} DeepLever. All rights reserved.</div>
        </div>
      </div>
    </footer>
  )
}
