"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { ProgressBar } from "@/components/progress-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample data for open positions
const positions = [
  { id: 1, pair: "SOL/USDC", entryPrice: 9.21, collateral: "100 USDC", healthFactor: 1.55 },
  { id: 2, pair: "SUI/USDC", entryPrice: 1.85, collateral: "200 USDC", healthFactor: 2.1 },
  { id: 3, pair: "ETH/USDC", entryPrice: 3450.75, collateral: "500 USDC", healthFactor: 1.78 },
]

export default function BorrowPage() {
  const [collateralAmount, setCollateralAmount] = useState("")
  const [collateralToken, setCollateralToken] = useState("USDC")

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-tomorrow mb-8">Borrower Dashboard</h1>

      <div className="space-y-8">
        <GlassCard title="Track Open Positions">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pair</TableHead>
                  <TableHead>Entry Price</TableHead>
                  <TableHead>Collateral</TableHead>
                  <TableHead>Health Factor</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">{position.pair}</TableCell>
                    <TableCell>${position.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>{position.collateral}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={position.healthFactor < 1.7 ? "text-yellow-400" : "text-green-400"}>
                          {position.healthFactor.toFixed(2)}
                        </span>
                        <ProgressBar
                          value={position.healthFactor}
                          max={3}
                          className="w-16"
                          showValue={false}
                          barClassName={position.healthFactor < 1.7 ? "bg-yellow-500" : "bg-green-500"}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 hover:bg-slate-800 hover:text-primary"
                      >
                        Close
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GlassCard title="Open More Positions">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Deposit Collateral</h3>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Amount"
                      value={collateralAmount}
                      onChange={(e) => setCollateralAmount(e.target.value)}
                      className="bg-slate-800/50 border-slate-700"
                    />
                  </div>
                  <div className="w-32">
                    <Select value={collateralToken} onValueChange={setCollateralToken}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700">
                        <SelectValue placeholder="Token" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="SUI">SUI</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90">
                    Deposit
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Trade with Leverage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-green-700/50 bg-green-900/20 hover:bg-green-900/30 text-green-400"
                  >
                    Long Position
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-700/50 bg-red-900/20 hover:bg-red-900/30 text-red-400"
                  >
                    Short Position
                  </Button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard title="Position Summary">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Collateral Value</span>
                <span className="font-tomorrow text-xl">$800.00</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Borrowed Value</span>
                <span className="font-tomorrow text-xl">$450.00</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Health Factor</span>
                <span className="font-tomorrow text-xl text-green-400">1.81</span>
              </div>

              <div className="space-y-2">
                <ProgressBar value={56.25} max={100} label="Utilization Ratio" />
                <p className="text-xs text-slate-400">The percentage of your collateral that is being used.</p>
              </div>

              <div className="space-y-2">
                <ProgressBar
                  value={1.81}
                  max={3}
                  label="Health Factor"
                  barClassName={(v) => (v > 1.7 ? "bg-green-500" : "bg-yellow-500")}
                />
                <p className="text-xs text-slate-400">If this drops below 1.0, your positions may be liquidated.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
