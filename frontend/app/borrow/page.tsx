"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/glass-card"
import { ProgressBar } from "@/components/progress-bar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { depositCollateral, withdrawCollateral, open as openSuiPosition, close as closeSuiPosition, getDebtAmount, getManualDebt } from "@/lib/suiInteractions"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  
  // State for user debt
  const [userDebtMist, setUserDebtMist] = useState<bigint>(0n);
  const [isLoadingDebt, setIsLoadingDebt] = useState(true);
  const [fetchDebtError, setFetchDebtError] = useState<string | null>(null);
  
  const [positionAmount, setPositionAmount] = useState("");
  const [positionPair, setPositionPair] = useState("SUI/SUI");
  const [positionMargin, setPositionMargin] = useState("3x");
  const [positionError, setPositionError] = useState<string | null>(null);

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

  // Fetch user's debt amount
  const fetchUserDebt = useCallback(async () => {
    if (!account?.address) {
      setUserDebtMist(0n);
      setIsLoadingDebt(false);
      return;
    }
    setIsLoadingDebt(true);
    setFetchDebtError(null);
    try {
      const debt = await getManualDebt();
      console.log("debt", debt);
      setUserDebtMist(debt);
    } catch (err) {
      console.error("Error fetching user debt:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred fetching debt";
      setFetchDebtError(errorMessage);
      setUserDebtMist(0n); // Default to 0 on error
    } finally {
      setIsLoadingDebt(false);
    }
  }, [account?.address, suiClient]);

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

  // Calculate max position size (3x collateral)
  const maxPositionSize = userCollateral > 0n ? mistToSui(userCollateral) * 3 : 0;

  // Handle open position
  const handleOpenPosition = async () => {
    setPositionError(null);
    if (!account || !account.address) {
      setPositionError("Please connect your wallet.");
      return;
    }
    const amount = parseFloat(positionAmount);
    if (isNaN(amount) || amount <= 0) {
      setPositionError("Enter a valid amount.");
      return;
    }
    if (amount > maxPositionSize) {
      setPositionError(`Amount cannot exceed 3x your collateral (${maxPositionSize.toFixed(4)} SUI)`);
      return;
    }
    // Only allow SUI/SUI and 3x for now
    if (positionPair !== "SUI/SUI" || positionMargin !== "3x") {
      setPositionError("Only SUI/SUI and 3x margin are supported right now.");
      return;
    }

    setIsSubmitting(true);
    setTxError(null);
    try {
      const amountMist = suiToMist(positionAmount);
      await openSuiPosition(
        amountMist,
        account.address,
        signAndExecuteTxAsync
      );
      setPositionAmount("");
      // Refetch debt and collateral balance
      fetchUserDebt();
      fetchCollateralBalance();
    } catch (error) {
      console.error("Open position error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during opening position.";
      setPositionError(errorMessage); // Use positionError for this form
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close position
  const handleClosePosition = async () => {
    if (!account || !account.address) {
      setTxError("Please connect your wallet."); // Use general txError or a specific one for the table
      return;
    }
    if (userDebtMist <= 0n) {
      setTxError("No debt to close.");
      return;
    }

    setIsSubmitting(true);
    setTxError(null);
    try {
      await closeSuiPosition(
        account.address,
        signAndExecuteTxAsync
      );
      // Refetch debt and collateral balance
      fetchUserDebt();
      fetchCollateralBalance();
    } catch (error) {
      console.error("Close position error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during closing position.";
      // Display this error appropriately, perhaps in the table or as a toast
      setTxError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCollateralBalance();
    fetchUserDebt(); // Fetch debt on component mount and when account changes
  }, [fetchCollateralBalance, fetchUserDebt]); // Added fetchUserDebt

  // Derived values for UI
  const currentCollateralSui = userCollateral > 0n ? mistToSui(userCollateral) : 0;
  const currentDebtSui = userDebtMist > 0n ? mistToSui(userDebtMist) : 0;
  
  // Utilization Ratio: (borrowed amount / (3 * collateral)) * 100
  let utilizationRatio = 0;
  if (userCollateral > 0n && userDebtMist > 0n && currentCollateralSui > 1e-9) { // ensure currentCollateralSui is not zero
    utilizationRatio = (currentDebtSui / (3 * currentCollateralSui)) * 100;
  }

  // Maintenance Margin calculation
  let initialMarginCalculation = 0; // Raw result, could be non-finite
  if (userCollateral > 0n) {
    if (currentCollateralSui > 1e-9) { // Epsilon for float comparison to avoid division by zero
        initialMarginCalculation = (3 * currentCollateralSui - currentDebtSui) / currentCollateralSui;
    } else if (currentDebtSui === 0) { // Collateral is effectively zero SUI, no debt
        initialMarginCalculation = 3; // Max margin
    } else { // Collateral is effectively zero SUI, with debt
        initialMarginCalculation = -Infinity; // Indicates liquidation / very bad state
    }
  }

  // Core logical margin value (can be negative, used for <0.25 check)
  const logicalBaseMargin = Number.isFinite(initialMarginCalculation)
                            ? initialMarginCalculation
                            : (initialMarginCalculation === -Infinity ? -1.0 : 0.0); // Represent -Infinity as -1 for logic

  // Value for the table's progress bar (0-3 scale, non-negative)
  const tableMaintenanceMarginValue = Math.max(0, logicalBaseMargin);

  // Scaled display text for the table (0-1 range, e.g., "0.33")
  const maintenanceMarginScaledDisplayText = (tableMaintenanceMarginValue / 3.0).toFixed(2);
  
  // Scaled value for the summary progress bar (0-1 range)
  const summaryMaintenanceMarginValueScaled = tableMaintenanceMarginValue / 3.0;

  // Color logic is based on the logicalBaseMargin (which can be negative)
  let maintenanceMarginColorClass = "text-green-400";
  let maintenanceMarginBarClass = "bg-green-500";
  if (logicalBaseMargin < 0.25) {
    maintenanceMarginColorClass = "text-red-400";
    maintenanceMarginBarClass = "bg-red-500";
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-tomorrow mb-8">Borrower Dashboard</h1>

      <div className="space-y-8">
        <GlassCard title="Track Open Positions">
          <div className="overflow-x-auto">
            {userDebtMist > 0n ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Borrowed Amount</TableHead>
                    <TableHead>Collateral</TableHead>
                    <TableHead>Maintenance Margin</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{positionPair}</TableCell>
                    <TableCell>{currentDebtSui.toFixed(4)} SUI</TableCell>
                    <TableCell>{currentCollateralSui.toFixed(4)} SUI</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={maintenanceMarginColorClass}>
                          {maintenanceMarginScaledDisplayText}
                        </span>
                        <ProgressBar
                          value={tableMaintenanceMarginValue}
                          max={3}
                          className="w-16"
                          showValue={false}
                          barClassName={maintenanceMarginBarClass}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 hover:bg-slate-800 hover:text-primary"
                        onClick={handleClosePosition}
                        disabled={isSubmitting}
                      >
                        Close
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 flex flex-col gap-6 items-center justify-center">
                <div className="text-sm text-slate-400 mb-2">No open positions</div>
                <div className="w-full max-w-md bg-slate-900/60 rounded-xl p-6 border border-slate-800">
                  <div className="mb-4 text-lg font-semibold text-slate-200">Open a Position</div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">Pair</label>
                      <Select value={positionPair} onValueChange={setPositionPair}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700">
                          <SelectValue placeholder="Select Pair" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SUI/SUI">SUI/SUI</SelectItem>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="SUI/USDC" disabled className="opacity-60 cursor-not-allowed">SUI/USDC</SelectItem>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-slate-200 border border-slate-700">
                                Coming soon!
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="ETH/USDC" disabled className="opacity-60 cursor-not-allowed">ETH/USDC</SelectItem>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-slate-200 border border-slate-700">
                                Coming soon!
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">Margin</label>
                      <Select value={positionMargin} onValueChange={setPositionMargin}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-700">
                          <SelectValue placeholder="Select Margin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3x">3x</SelectItem>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="5x" disabled className="opacity-60 cursor-not-allowed">5x</SelectItem>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-slate-200 border border-slate-700">
                                Coming soon!
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <SelectItem value="10x" disabled className="opacity-60 cursor-not-allowed">10x</SelectItem>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-800 text-slate-200 border border-slate-700">
                                Coming soon!
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-1">Amount (max {maxPositionSize.toFixed(4)} SUI)</label>
                      <Input
                        type="number"
                        min="0"
                        max={maxPositionSize}
                        step="any"
                        placeholder="Enter amount"
                        value={positionAmount}
                        onChange={e => setPositionAmount(e.target.value)}
                        className="bg-slate-800/50 border-slate-700"
                        disabled={maxPositionSize === 0}
                      />
                    </div>
                    <Button
                      className="bg-gradient-to-r from-[#33A3FF] to-[#8EE6FF] text-slate-900 hover:opacity-90"
                      onClick={handleOpenPosition}
                      disabled={maxPositionSize === 0}
                    >
                      Open Position
                    </Button>
                    {positionError && <div className="text-red-500 text-sm mt-1">{positionError}</div>}
                    {maxPositionSize === 0 && (
                      <div className="text-yellow-400 text-xs mt-2">You need collateral to open a position.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                    <span className="font-tomorrow text-lg">Loading...</span>
                  ) : fetchError ? (
                    <span className="font-tomorrow text-lg text-red-500">{collateralUsd}</span>
                  ) : (
                    <span className="font-tomorrow text-lg text-green-400">{collateralUsd}</span>
                  )
                }
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Borrowed Value</span>
                {isLoadingDebt ? (
                    <span className="font-tomorrow text-lg">Loading...</span>
                ) : fetchDebtError ? (
                    <span className="font-tomorrow text-lg text-red-500">Error</span>
                ) : (
                    <span className="font-tomorrow text-lg">{currentDebtSui.toFixed(4)} SUI</span>
                )}
              </div>

              <div className="space-y-2">
                {/* <span className="text-slate-400">Utilization Ratio</span> */}
                <ProgressBar value={utilizationRatio} max={100} label="Utilization Ratio" />
                <p className="text-xs text-slate-400">The percentage of your collateral that is being used.</p>
              </div>

              <div className="space-y-2">
                <ProgressBar
                  value={summaryMaintenanceMarginValueScaled}
                  max={1}
                  label="Maintenance Margin"
                  barClassName={maintenanceMarginBarClass}
                />
                <p className="text-xs text-slate-400">If this drops below 10%, your positions may be liquidated.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
