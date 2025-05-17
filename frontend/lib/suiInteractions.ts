// This file would live in your frontend, e.g., frontend/lib/suiInteractions.ts

import { Transaction, TransactionArgument } from '@mysten/sui/transactions';
import { SuiClient, SuiTransactionBlockResponseOptions } from '@mysten/sui/client'; // CoinStruct no longer directly needed for depositSui logic
import { bcs as suiBcs } from '@mysten/bcs';
// Removed problematic type imports from dapp-kit or sui/client for signer output

// These should ideally be stored in environment variables or a centralized config
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const VAULT_OBJECT_ID = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID!;
const VAULT_MODULE_NAME = 'vault'; // as defined in your vault.move
const DEFAULT_GAS_BUDGET = 20_000_000n; // Example gas budget, adjust as needed
const COLLATERAL_PACKAGE_ID = process.env.NEXT_PUBLIC_Collateral_Package_ID!;
const COLLATERAL_VAULT_OBJECT_ID = process.env.NEXT_PUBLIC_Collateral_Vault_ID!;
const COLLATERAL_MODULE_NAME = 'reserve'; // from collateral.move
const BORROWER_VAULT_OBJECT_ID = process.env.NEXT_PUBLIC_BORROWER_VAULT_OBJECT_ID!;
const BORROWER_MODULE_NAME = 'borrower_funds'; 
const BORROWER_PACKAGE_ID = process.env.NEXT_PUBLIC_BORROWER_PACKAGE_ID!; 

// --- Manual debt tracking (temporary workaround) ---
let manualDebt: bigint = 0n;

export function getManualDebt(): bigint {
    return manualDebt;
}

/**
 * Creates and proposes a deposit transaction for the lending vault.
 * Uses txb.gas as the source for the deposit amount by splitting it.
 * The remainder of txb.gas is automatically used for gas fees.
 * @param amountMIST The amount of SUI to deposit in MIST (1 SUI = 1,000,000,000 MIST).
 * @param userAddress The address of the user making the deposit.
 * @param suiClient A SuiClient instance (used for an initial coin check).
 * @param signer An async function (like mutateAsync from dapp-kit) to sign and execute the transaction.
 * @returns The result of the transaction execution.
 */
export async function depositSui(
    amountMIST: bigint,
    userAddress: string,
    suiClient: SuiClient,
    signer: (args: { transaction: Transaction; options: { showInput: true }; requestType?: any; }) => Promise<any>
) {
    if (!signer) throw new Error('Wallet not connected or signer not available');
    if (!userAddress) throw new Error('User address not provided');
    if (!suiClient) throw new Error('SuiClient not provided');
    if (amountMIST <= 0n) throw new Error('Deposit amount must be positive.');

    // Initial check to see if the user has any SUI coins at all.
    // This doesn't guarantee txb.gas has enough for amountMIST + fees,
    // but it's a basic sanity check before attempting the transaction.
    const { data: allUserSuiCoins } = await suiClient.getCoins({
        owner: userAddress,
        coinType: '0x2::sui::SUI',
    });

    if (!allUserSuiCoins || allUserSuiCoins.length === 0) {
        throw new Error('No SUI coins found in your wallet. The transaction would likely fail as txb.gas might be invalid or insufficient.');
    }
    // No need to iterate or manage these specific coins if relying on txb.gas split strategy.

    const txb = new Transaction();
    txb.setSender(userAddress);
    txb.setGasBudget(DEFAULT_GAS_BUDGET);

    // Split the exact deposit amount from txb.gas.
    // `coinToDeposit` will be the new coin object containing `amountMIST`.
    // `txb.gas` (the original gas coin) will have its balance reduced by `amountMIST`
    // and will be automatically used by the system to pay for transaction fees.
    const [coinToDeposit] = txb.splitCoins(txb.gas, [txb.pure.u64(amountMIST.toString())]);

    txb.moveCall({
        target: `${PACKAGE_ID}::${VAULT_MODULE_NAME}::deposit`,
        arguments: [
            txb.object(VAULT_OBJECT_ID),
            coinToDeposit // Use the newly created coin for the deposit
        ],
    });

    try {
        const result = await signer({ transaction: txb, options: { showInput: true } });
        console.log('Deposit transaction successful (using txb.gas split strategy):', result);
        return result;
    } catch (error) {
        console.error('Error during deposit transaction (using txb.gas split strategy):', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            // Log transaction block data if the error seems related to gas/balance issues
            if (txb && txb.blockData && (error.message.includes("No valid gas coins") || error.message.includes("Gas balance is less than") || error.message.includes("Unable to select a gas coin with balance greater than or equal to"))) {
                 console.error('Transaction block data at time of error:', JSON.stringify(txb.blockData, null, 2));
                 console.error(`This error likely means the primary gas coin (txb.gas) did not have sufficient balance (at least ${amountMIST / BigInt(1_000_000_000)} SUI + gas fees) to cover the deposit of ${amountMIST / BigInt(1_000_000_000)} SUI and transaction costs.`);
            }
        }
        throw error;
    }
}

/**
 * Creates and proposes a withdrawal transaction for the lending vault.
 * @param amountMIST The amount of SUI to withdraw in MIST.
 * @param signer A signer object obtained from the user's connected wallet.
 * @returns The result of the transaction execution.
 */
export async function withdrawSui(
    amountMIST: bigint | string,
    signer: (args: { transaction: Transaction; options?: any; requestType?: any; }) => Promise<any> // Simplified signer type
) {
    if (!signer) throw new Error('Wallet not connected or signer not available');
    const amountToWithdraw = BigInt(amountMIST);
    if (amountToWithdraw <= 0n) throw new Error('Withdrawal amount must be positive.');

    const txb = new Transaction();

    txb.moveCall({
        target: `${PACKAGE_ID}::${VAULT_MODULE_NAME}::withdraw`,
        arguments: [
            txb.object(VAULT_OBJECT_ID),
            txb.pure.u64(amountToWithdraw.toString()) // contract expects u64, ensure string representation
        ],
    });

    try {
        const result = await signer({ transaction: txb, options: { showInput: true } });
        console.log('Withdrawal transaction successful:', result);
        // await provider.waitForTransactionBlock({ digest: result.digest, options: { showEffects: true } });
        return result;
    } catch (error) {
        console.error('Error during withdrawal transaction:', error);
        throw error;
    }
}

/**
 * Creates and proposes a deposit transaction for the collateral vault.
 * Uses txb.gas as the source for the deposit amount by splitting it.
 * The remainder of txb.gas is automatically used for gas fees.
 * @param amountMIST The amount of SUI to deposit in MIST (1 SUI = 1,000,000,000 MIST).
 * @param userAddress The address of the user making the deposit.
 * @param suiClient A SuiClient instance (used for an initial coin check).
 * @param signer An async function (like mutateAsync from dapp-kit) to sign and execute the transaction.
 * @returns The result of the transaction execution.
 */
export async function depositCollateral(
    amountMIST: bigint,
    userAddress: string,
    suiClient: SuiClient,
    signer: (args: { transaction: Transaction; options: { showInput: true }; requestType?: any; }) => Promise<any>
) {
    if (!signer) throw new Error('Wallet not connected or signer not available');
    if (!userAddress) throw new Error('User address not provided');
    if (!suiClient) throw new Error('SuiClient not provided');
    if (amountMIST <= 0n) throw new Error('Deposit amount must be positive.');

    // Initial check to see if the user has any SUI coins at all.
    const { data: allUserSuiCoins } = await suiClient.getCoins({
        owner: userAddress,
        coinType: '0x2::sui::SUI',
    });

    if (!allUserSuiCoins || allUserSuiCoins.length === 0) {
        throw new Error('No SUI coins found in your wallet. The transaction would likely fail as txb.gas might be invalid or insufficient.');
    }

    const txb = new Transaction();
    txb.setSender(userAddress);
    txb.setGasBudget(DEFAULT_GAS_BUDGET);

    // Split the exact deposit amount from txb.gas.
    const [coinToDeposit] = txb.splitCoins(txb.gas, [txb.pure.u64(amountMIST.toString())]);

    txb.moveCall({
        target: `${COLLATERAL_PACKAGE_ID}::${COLLATERAL_MODULE_NAME}::deposit`,
        arguments: [
            txb.object(COLLATERAL_VAULT_OBJECT_ID),
            coinToDeposit // Use the newly created coin for the deposit
        ],
    });

    try {
        const result = await signer({ transaction: txb, options: { showInput: true } });
        console.log('Collateral deposit transaction successful:', result);
        return result;
    } catch (error) {
        console.error('Error during collateral deposit transaction:', error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            if (txb && txb.blockData && (error.message.includes("No valid gas coins") || error.message.includes("Gas balance is less than"))) {
                 console.error('Transaction block data at time of error:', JSON.stringify(txb.blockData, null, 2));
                 console.error(`This error likely means the primary gas coin (txb.gas) did not have sufficient balance (at least ${amountMIST / BigInt(1_000_000_000)} SUI + gas fees).`);
            }
        }
        throw error;
    }
}

/**
 * Creates and proposes a withdrawal transaction for the collateral vault.
 * @param amountMIST The amount of SUI to withdraw in MIST.
 * @param userAddress The address of the user making the withdrawal.
 * @param signer A signer function to sign and execute the transaction.
 * @returns The result of the transaction execution.
 */
export async function withdrawCollateral(
    amountMIST: bigint | string,
    signer: (args: { transaction: Transaction; options?: any; requestType?: any; }) => Promise<any>
) {
    if (!signer) throw new Error('Wallet not connected or signer not available');
    
    const amountToWithdraw = BigInt(amountMIST);
    if (amountToWithdraw <= 0n) throw new Error('Withdrawal amount must be positive.');

    const txb = new Transaction();

    txb.moveCall({
        target: `${COLLATERAL_PACKAGE_ID}::${COLLATERAL_MODULE_NAME}::withdraw`,
        arguments: [
            txb.object(COLLATERAL_VAULT_OBJECT_ID),
            txb.pure.u64(amountToWithdraw.toString()) // contract expects u64, ensure string representation
        ],
    });

    try {
        const result = await signer({ transaction: txb, options: { showInput: true } });
        console.log('Collateral withdrawal transaction successful:', result);
        return result;
    } catch (error) {
        console.error('Error during collateral withdrawal transaction:', error);
        throw error;
    }
}

/**
 * Opens a borrow position by calling the borrow function in the vault.
 * @param amountMIST The amount of SUI to borrow in MIST.
 * @param userAddress The address of the user initiating the borrow.
 * @param signer An async function to sign and execute the transaction.
 * @returns The result of the transaction execution.
 */
export async function open(
    amountMIST: bigint,
    userAddress: string,
    signer: (args: { transaction: Transaction; options?: any; requestType?: any; }) => Promise<any>
) {
    if (!signer) throw new Error('Wallet not connected or signer not available');
    if (!userAddress) throw new Error('User address not provided');
    if (amountMIST <= 0n) throw new Error('Borrow amount must be positive.');

    const txb = new Transaction();
    txb.setSender(userAddress);
    txb.setGasBudget(DEFAULT_GAS_BUDGET);

    txb.moveCall({
        target: `${PACKAGE_ID}::${VAULT_MODULE_NAME}::borrow`,
        arguments: [
            txb.object(VAULT_OBJECT_ID),
            txb.object(COLLATERAL_VAULT_OBJECT_ID),
            txb.object(BORROWER_VAULT_OBJECT_ID),
            txb.pure.u64(amountMIST.toString())
        ],
    });

    try {
        const result = await signer({ transaction: txb, options: { showInput: true } });
        console.log('Borrow (open) transaction successful:', result);
        // --- Update manual debt tracker ---
        manualDebt += amountMIST;
        return result;
    } catch (error) {
        console.error('Error during borrow (open) transaction:', error);
        throw error;
    }
}

/**
 * Closes a borrow position by calling the repay function in the vault.
 * @param userAddress The address of the user initiating the repay.
 * @param signer An async function to sign and execute the transaction.
 * @returns The result of the transaction execution.
 */
export async function close(
    userAddress: string,
    signer: (args: { transaction: Transaction; options?: any; requestType?: any; }) => Promise<any>
) {
    if (!signer) throw new Error('Wallet not connected or signer not available');
    if (!userAddress) throw new Error('User address not provided');

    const txb = new Transaction();
    txb.setSender(userAddress);
    txb.setGasBudget(DEFAULT_GAS_BUDGET); // Good practice, though repay might not split coins

    txb.moveCall({
        target: `${PACKAGE_ID}::${VAULT_MODULE_NAME}::repay`,
        arguments: [
            txb.object(VAULT_OBJECT_ID),
            txb.object(BORROWER_VAULT_OBJECT_ID)
        ],
    });

    try {
        const result = await signer({ transaction: txb, options: { showInput: true } });
        console.log('Repay (close) transaction successful:', result);
        // --- Reset manual debt tracker ---
        manualDebt = 0n;
        return result;
    } catch (error) {
        console.error('Error during repay (close) transaction:', error);
        throw error;
    }
}

/**
 * Fetches the current debt amount for a user from the vault.
 * @param userAddress The address of the user.
 * @param suiClient A SuiClient instance.
 * @returns The user's debt amount in MIST as a bigint.
 */
export async function getDebtAmount(
    userAddress: string,
    suiClient: SuiClient
): Promise<bigint> {
    if (!userAddress) throw new Error('User address not provided');
    if (!suiClient) throw new Error('SuiClient not provided');

    try {
        // 1) Fetch the dynamic-field object for this key
        const df = await suiClient.getDynamicFieldObject({
            parentId: VAULT_OBJECT_ID,
            name: { type: 'address', value: userAddress },
        });
        // 2) If no such child, debt = 0
        if (!df || !df.data?.objectId) return 0n;

        // 3) Grab that child object to read its fields
        const child = await suiClient.getObject({
            id: df.data.objectId,
            options: { showContent: true },
        });
        const childData = child.data;
        if (!childData) {
            throw new Error('Dynamic field child object not found');
        }
        // Type guard for SuiParsedData
        const content = childData.content;
        if (!content || content.dataType !== 'moveObject') {
            throw new Error(`Expected moveObject content, got: ${content?.dataType ?? 'undefined'}`);
        }
        const fields = content.fields as Record<string, any>;
        if (!fields || typeof fields.value !== 'string') {
            throw new Error('Debt value field missing or not a string');
        }
        // 4) The `value` field is your u128 debt (as a decimal string)
        return BigInt(fields.value);
    } catch (e: any) {
        // If the RPC tells you "no such dynamic field", that just means zero
        if (
            e.code === 'DYNAMIC_FIELD_NOT_FOUND' ||
            /dynamic field not found/i.test(e.message)
        ) {
            return 0n;
        }
        // Log unexpected errors for easier debugging
        console.error('Error in getDebtAmount:', e);
        throw e;
    }
}

