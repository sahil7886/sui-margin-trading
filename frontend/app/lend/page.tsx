"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { ProgressBar } from "@/components/progress-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function LendPage() {
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("USDC")

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-tomorrow mb-8">Lender Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GlassCard title="Supply Assets">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-slate-800/50 border-slate-700"
                  />
                </div>
                <div className="w-32">
                  <Select value={token} onValueChange={setToken}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700">
                      <SelectValue placeholder="Token" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="SUI">SUI</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90">
                  Supply
                </Button>
              </div>

              <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                Withdraw Assets
              </Button>
            </div>
          </GlassCard>

          <GlassCard title="Earnings Dashboard">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Supplied</span>
                <span className="font-tomorrow text-xl">$125,000</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Interest Earned</span>
                <span className="font-tomorrow text-xl text-green-400">$1,250</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">% APY</span>
                <span className="font-tomorrow text-xl text-green-400">12.3%</span>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="space-y-6">
          <GlassCard title="Risk Indicators">
            <div className="space-y-6">
              <div className="space-y-2">
                <ProgressBar value={73} max={100} label="Utilization Ratio" />
                <p className="text-xs text-slate-400">The percentage of supplied assets currently being borrowed.</p>
              </div>

              <div className="space-y-2">
                <ProgressBar
                  value={2.6}
                  max={5}
                  label="Liquidation Buffer"
                  valueFormatter={(v) => `${v.toFixed(1)} yrs`}
                  barClassName={(v) => (v > 2 ? "bg-green-500" : "bg-yellow-500")}
                />
                <p className="text-xs text-slate-400">
                  Estimated time before liquidation events may occur at current market conditions.
                </p>
              </div>

              <div className="space-y-2">
                <ProgressBar value={85} max={100} label="Protocol Health" barClassName="bg-green-500" />
                <p className="text-xs text-slate-400">
                  Overall health score based on collateralization ratios and market volatility.
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Market Overview">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-slate-400">USDC Supply APY</div>
                  <div className="font-tomorrow text-lg text-green-400">12.3%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-400">SUI Supply APY</div>
                  <div className="font-tomorrow text-lg text-green-400">8.7%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-400">ETH Supply APY</div>
                  <div className="font-tomorrow text-lg text-green-400">6.2%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-slate-400">BTC Supply APY</div>
                  <div className="font-tomorrow text-lg text-green-400">5.8%</div>
                </div>
              </div>

              <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800">
                View All Markets
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
