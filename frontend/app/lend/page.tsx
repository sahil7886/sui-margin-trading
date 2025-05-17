"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { ProgressBar } from "@/components/progress-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { depositSui, withdrawSui } from "@/lib/suiInteractions"; // Assuming suiInteractions.ts is in lib

export default function LendPage() {
  const [amount, setAmount] = useState("")
  const [token, setToken] = useState("SUI") // Default to SUI as it's the only one enabled
  const [totalSuppliedUsd, setTotalSuppliedUsd] = useState<string | null>(null)
  const [isLoadingTotalSupplied, setIsLoadingTotalSupplied] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTxAsync } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();

  // Define fetchTotalSupplied using useCallback to memoize it
  const fetchTotalSupplied = useCallback(async () => {
    setIsLoadingTotalSupplied(true);
    setFetchError(null);
    const userAddress = account?.address;
    console.log('Current user address for API call:', userAddress || 'No user address');

    if (!userAddress) {
      console.warn('User address not available. Skipping fetchTotalSupplied.');
      setTotalSuppliedUsd('N/A (Connect Wallet)');
      setIsLoadingTotalSupplied(false);
      return;
    }

    try {
      const response = await fetch(`/api/total-supplied?userAddress=${userAddress}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch total supplied: ${response.statusText}`);
      }
      const data = await response.json();
      setTotalSuppliedUsd(data.balanceUsd ? `$${data.balanceUsd}` : 'Error loading data');
    } catch (err) {
      console.error("Error fetching total supplied:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setFetchError(errorMessage);
      setTotalSuppliedUsd('Error');
    } finally {
      setIsLoadingTotalSupplied(false);
    }
  }, [account?.address]); // Dependency: account?.address

  useEffect(() => {
    fetchTotalSupplied();
  }, [fetchTotalSupplied]); // useEffect now depends on the memoized fetchTotalSupplied

  const handleSupply = async () => {
    if (!account || !account.address) {
      setTxError("Please connect your wallet.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setTxError("Please enter a valid amount.");
      return;
    }
    if (token !== "SUI") {
      setTxError("Currently, only SUI deposits are supported.");
      return;
    }

    setIsSubmitting(true);
    setTxError(null);

    try {
      // Assuming amount is in SUI, convert to MIST (1 SUI = 10^9 MIST)
      const amountMIST = BigInt(parseFloat(amount) * 1e9);
      await depositSui(
        amountMIST,
        account.address, // Pass userAddress
        suiClient,       // Pass suiClient
        signAndExecuteTxAsync // Pass the async mutate function
      );
      // Optionally: show success message, refetch total supplied, clear amount
      setAmount("");
      fetchTotalSupplied(); 
    } catch (err) {
      console.error("Error during supply transaction:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during supply.";
      setTxError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!account || !account.address) {
      setTxError("Please connect your wallet.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setTxError("Please enter a valid amount to withdraw.");
      return;
    }
    if (token !== "SUI") {
      setTxError("Currently, only SUI withdrawals are supported.");
      return;
    }

    setIsSubmitting(true);
    setTxError(null);

    try {
      // Assuming amount is in SUI, convert to MIST
      const amountMIST = BigInt(parseFloat(amount) * 1e9);
      await withdrawSui(
        amountMIST,
        signAndExecuteTxAsync // Pass the async mutate function
      );
      // Optionally: show success message, refetch total supplied, clear amount
      setAmount("");
      fetchTotalSupplied();
    } catch (err) {
      console.error("Error during withdraw transaction:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during withdrawal.";
      setTxError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    placeholder="Amount (e.g., 10 SUI)"
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
                      <SelectItem value="SUI">SUI</SelectItem>
                      {/* <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90"
                  onClick={handleSupply}
                  disabled={isSubmitting || !account}
                >
                  {isSubmitting ? "Submitting..." : "Supply"}
                </Button>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-slate-700 hover:bg-slate-800"
                onClick={handleWithdraw}
                disabled={isSubmitting || !account}
              >
                {isSubmitting ? "Submitting..." : "Withdraw Assets"}
              </Button>
              {txError && <p className="text-red-500 text-sm mt-2">{txError}</p>}
            </div>
          </GlassCard>

          <GlassCard title="Earnings Dashboard">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Supplied</span>
                {
                  isLoadingTotalSupplied ? (
                    <span className="font-tomorrow text-xl">Loading...</span>
                  ) : fetchError ? (
                    <span className="font-tomorrow text-xl text-red-500">{totalSuppliedUsd}</span>
                  ) : (
                    <span className="font-tomorrow text-xl text-green-400">{totalSuppliedUsd}</span>
                  )
                }
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
                {(() => {
                  const liquidationBufferValue = 2.6;
                  return (
                    <ProgressBar
                      value={liquidationBufferValue}
                      max={5}
                      label="Liquidation Buffer"
                      valueFormatter={(v: number) => `${v.toFixed(1)} yrs`}
                      barClassName={liquidationBufferValue > 2 ? "bg-green-500" : "bg-yellow-500"}
                    />
                  );
                })()}
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
