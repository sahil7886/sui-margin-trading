import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { TVLCounter } from "@/components/tvl-counter"
import { GlassCard } from "@/components/glass-card"

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900 to-slate-950 z-0"></div>
      
      <section className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-tomorrow text-5xl md:text-6xl lg:text-7xl leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
              Bring CEX-grade leverage to Sui – safely, transparently.
            </h1>

            <div className="mt-8 space-y-4 text-slate-300">
              <p className="text-xl">Backed by industry-leading security audits and reliable oracle data.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm">CertiK Audited</div>
                <div className="bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-sm">Pyth Oracle Powered</div>
                <div className="bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-full text-sm">
                  DeepBook Integration
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90 px-8 py-6 text-lg"
              >
                <Link href="/borrow">Start Borrowing</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-slate-700 hover:bg-slate-800 hover:text-primary px-8 py-6 text-lg"
              >
                <Link href="/lend">Start Lending</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* TVL Counter Section */}
      <section className="pb-24 relative z-10">
        <div className="container">
          <GlassCard className="max-w-xl mx-auto bg-slate-900/50 backdrop-blur-lg border border-slate-800/50">
            <div className="flex flex-col items-center">
              {/* <p className="text-lg text-slate-400 mb-2">Total Value Locked</p> */}
              <TVLCounter className="text-xl md:text-2xl font-bold" />
            </div>
          </GlassCard>
        </div>
      </section>

      <div className="container py-6 border-t border-slate-800 relative z-10">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-sm font-medium">
              Security Audited
            </div>
            <div className="bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-full text-sm font-medium">
              Oracle Backed
            </div>
          </div>

          <div className="flex items-center gap-8">
            <Image
              src="/placeholder.svg?height=32&width=80"
              alt="Pyth"
              width={80}
              height={32}
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
            <Image
              src="/placeholder.svg?height=32&width=80"
              alt="DeepBook"
              width={80}
              height={32}
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
            <Image
              src="/placeholder.svg?height=32&width=80"
              alt="Sui"
              width={80}
              height={32}
              className="opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
