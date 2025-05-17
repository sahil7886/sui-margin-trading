import { NextRequest, NextResponse } from 'next/server';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { bcs as suiBcs } from '@mysten/bcs';

const rpcUrl = getFullnodeUrl('devnet');
const client = new SuiClient({ url: rpcUrl });

const COLLATERAL_PACKAGE_ID = process.env.NEXT_PUBLIC_Collateral_Package_ID!;
const COLLATERAL_VAULT_OBJECT_ID = process.env.NEXT_PUBLIC_Collateral_Vault_ID!;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userAddress = searchParams.get('userAddress');

        if (!userAddress) {
            return NextResponse.json({ error: 'userAddress query parameter is required.' }, { status: 400 });
        }

        const tx = new Transaction();
        tx.moveCall({
            target: `${COLLATERAL_PACKAGE_ID}::reserve::collateral_balance_of`,
            arguments: [
                tx.object(COLLATERAL_VAULT_OBJECT_ID),
                tx.pure.address(userAddress)
            ],
            typeArguments: [],
        });

        const inspectResults = await client.devInspectTransactionBlock({
            sender: userAddress,
            transactionBlock: tx,
        });

        if (inspectResults.error || !inspectResults.results || inspectResults.results.length === 0 || !inspectResults.results[0].returnValues || inspectResults.results[0].returnValues.length === 0) {
            console.error('Error inspecting transaction or no return values:', inspectResults.error || 'No return values found');
            throw new Error(`Failed to inspect transaction for balance_of. Error: ${inspectResults.error}`);
        }

        const returnValueData = inspectResults.results[0].returnValues[0];
        const [bytes, type] = returnValueData;

        if (type !== 'u128') {
            throw new Error(`Unexpected return type for balance_of: expected u128, got ${type}`);
        }

        // Deserialize u128 using the u128 type definition from the imported suiBcs instance
        const suiBalanceString = suiBcs.u128().parse(Uint8Array.from(bytes));
        const suiBalanceBigInt = BigInt(suiBalanceString); // Assuming parse returns a string for u128

        // Fetch SUI price (USD) from our /api/sui-price endpoint
        const { origin } = new URL(request.url);
        const priceResponse = await fetch(`${origin}/api/sui-price`);
        if (!priceResponse.ok) {
            throw new Error('Failed to fetch SUI price');
        }
        const priceData = await priceResponse.json();
        const suiPriceUsd = priceData.price;
        const balanceUsd = (Number(suiBalanceBigInt) / 1e9) * suiPriceUsd; // Assuming SUI has 9 decimal places (MIST)

        return NextResponse.json({
            balanceSui: suiBalanceBigInt.toString(),
            balanceUsd: balanceUsd.toFixed(2)
        });
    } catch (error) {
        console.error('Error in /api/total-collateral (balance_of):', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get wallet balance.';
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
} 