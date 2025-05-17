"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { ProgressBar } from "@/components/progress-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { depositCollateral, withdrawCollateral } from "@/lib/suiInteractions"

// Sample data for open positions
const positions = [
  { id: 1, pair: "SOL/USDC", entryPrice: 9.21, collateral: "100 USDC", healthFactor: 1.55 },
  { id: 2, pair: "SUI/USDC", entryPrice: 1.85, collateral: "200 USDC", healthFactor: 2.1 },
  { id: 3, pair: "ETH/USDC", entryPrice: 3450.75, collateral: "500 USDC", healthFactor: 1.78 },
]

// SUI token decimals (1 SUI = 10^9 MIST)
const SUI_DECIMALS = 9;

export default function BorrowPage() {
  const [collateralAmount, setCollateralAmount] = useState("")
  const [collateralToken, setCollateralToken] = useState("SUI")
  const [userCollateral, setUserCollateral] = useState<bigint>(0n)
  const [collateralUsd, setCollateralUsd] = useState<string | null>(null)
  const [isLoadingCollateral, setIsLoadingCollateral] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [txError, setTxError] = useState<string | null>(null)
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecuteTxAsync } = useSignAndExecuteTransaction();

  // Convert MIST to SUI for display
  const mistToSui = (mist: bigint): number => {
    return Number(mist) / Math.pow(10, SUI_DECIMALS);
  };

  // Convert SUI string to MIST for transactions
  const suiToMist = (sui: string): bigint => {
    try {
      const amount = parseFloat(sui);
      if (isNaN(amount) || amount <= 0) return 0n;
      return BigInt(Math.floor(amount * Math.pow(10, SUI_DECIMALS)));
    } catch (e) {
      console.error("Error converting SUI to MIST:", e);
      return 0n;
    }
  };

  // Calculate utilization ratio
  const calculateUtilizationRatio = (): number => {
    // For now, borrowed value is 0, so utilization is 0
    return 0;
  };

  // Fetch user's collateral balance in USD
  const fetchCollateralBalance = useCallback(async () => {
    setIsLoadingCollateral(true);
    setFetchError(null);
    const userAddress = account?.address;
    if (!userAddress) {
      setCollateralUsd('N/A (Connect Wallet)');
      setIsLoadingCollateral(false);
      return;
    }
    try {
      const response = await fetch(`/api/collateral-balance?userAddress=${userAddress}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch collateral balance: ${response.statusText}`);
      }
      const data = await response.json();
      setCollateralUsd(data.balanceUsd ? `$${data.balanceUsd}` : 'Error loading data');
      setUserCollateral(BigInt(data.balanceSui || 0));
    } catch (err) {
      console.error("Error fetching collateral balance:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setFetchError(errorMessage);
      setCollateralUsd('Error');
    } finally {
      setIsLoadingCollateral(false);
    }
  }, [account?.address]);

  // Handle deposit
  const handleDeposit = async () => {
    if (!account || !account.address) {
      setTxError("Please connect your wallet.");
      return;
    }
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      setTxError("Please enter a valid amount.");
      return;
    }
    if (collateralToken !== "SUI") {
      setTxError("Currently, only SUI deposits are supported.");
      return;
    }
    setIsSubmitting(true);
    setTxError(null);
    try {
      const amountMist = suiToMist(collateralAmount);
      await depositCollateral(
        amountMist,
        account.address,
        suiClient,
        signAndExecuteTxAsync
      );
      setCollateralAmount("");
      fetchCollateralBalance();
    } catch (error) {
      console.error("Deposit error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during deposit.";
      setTxError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!account || !account.address) {
      setTxError("Please connect your wallet.");
      return;
    }
    if (!collateralAmount || parseFloat(collateralAmount) <= 0) {
      setTxError("Please enter a valid amount to withdraw.");
      return;
    }
    if (collateralToken !== "SUI") {
      setTxError("Currently, only SUI withdrawals are supported.");
      return;
    }
    const amountMist = suiToMist(collateralAmount);
    if (amountMist > userCollateral) {
      setTxError("You don't have enough collateral to withdraw this amount.");
      return;
    }
    setIsSubmitting(true);
    setTxError(null);
    try {
      await withdrawCollateral(
        amountMist,
        signAndExecuteTxAsync
      );
      setCollateralAmount("");
      fetchCollateralBalance();
    } catch (error) {
      console.error("Withdrawal error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during withdrawal.";
      setTxError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCollateralBalance();
  }, [fetchCollateralBalance]);

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
                        <SelectItem value="SUI">SUI</SelectItem>
                        {/* Commented out other tokens for now
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                        */}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90"
                    disabled={isSubmitting || !account}
                    onClick={handleDeposit}
                  >
                    {isSubmitting ? 'Processing...' : 'Deposit'}
                  </Button>
                </div>
                {account && userCollateral > 0n && (
                  <div className="text-sm text-slate-400">
                    Your deposited collateral: {mistToSui(userCollateral).toFixed(4)} SUI
                    <Button 
                      variant="link" 
                      className="ml-2 text-xs text-blue-400 p-0 h-auto"
                      onClick={handleWithdraw}
                      disabled={isSubmitting}
                    >
                      Withdraw
                    </Button>
                  </div>
                )}
                {txError && <p className="text-red-500 text-sm mt-2">{txError}</p>}
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
                <span className="text-slate-400">Your Collateral Value</span>
                {
                  isLoadingCollateral ? (
                    <span className="font-tomorrow text-xl">Loading...</span>
                  ) : fetchError ? (
                    <span className="font-tomorrow text-xl text-red-500">{collateralUsd}</span>
                  ) : (
                    <span className="font-tomorrow text-xl text-green-400">{collateralUsd}</span>
                  )
                }
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Borrowed Value</span>
                <span className="font-tomorrow text-xl">$0.00</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Health Factor</span>
                <span className="font-tomorrow text-xl text-green-400">N/A</span>
              </div>

              <div className="space-y-2">
                <ProgressBar value={calculateUtilizationRatio()} max={100} label="Utilization Ratio" />
                <p className="text-xs text-slate-400">The percentage of your collateral that is being used.</p>
              </div>

              <div className="space-y-2">
                <ProgressBar
                  value={0}
                  max={3}
                  label="Health Factor"
                  barClassName="bg-green-500"
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
