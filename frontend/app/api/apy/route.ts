// import { NextResponse } from 'next/server';
// import { JsonRpcProvider, Connection } from '@mysten/sui.js';

// const SUI_DEVNET_URL = 'https://fullnode.devnet.sui.io:443';
// const provider = new JsonRpcProvider(new Connection({ fullnode: SUI_DEVNET_URL }));

// const VAULT_OBJECT_ID = process.env.NEXT_PUBLIC_VAULT_OBJECT_ID!;

// // Helper to get vault object data (can be shared if multiple API routes need it)
// async function getVaultObject() {
//     try {
//         const object = await provider.getObject({
//             id: VAULT_OBJECT_ID,
//             options: { showContent: true },
//         });
//         // Add type assertion for stronger typing if you know the structure
//         if (object.data && object.data.content && object.data.content.fields) {
//             return object.data.content.fields as { total_deposits: string, pool: { fields: { balance: string } } };
//         }
//         throw new Error('Vault object not found or content is missing.');
//     } catch (error) {
//         console.error('Error fetching vault object:', error);
//         throw error;
//     }
// }

// export async function GET() {
//     try {
//         const vaultState = await getVaultObject();
//         const totalDeposits = BigInt(vaultState.total_deposits);
//         const totalLiquidity = BigInt(vaultState.pool.fields.balance);

//         if (totalDeposits === 0n) {
//             return NextResponse.json({ 
//                 apy: '0.00%', 
//                 utilizationRatio: '0.00%', 
//                 totalLiquidity: totalLiquidity.toString(),
//                 totalDeposits: totalDeposits.toString(),
//             });
//         }

//         let utilizationRatio = 0;
//         if (totalDeposits > 0n) {
//             const tlNum = Number(totalLiquidity);
//             const tdNum = Number(totalDeposits);
//             if (tdNum > 0) { // Avoid division by zero if totalDeposits was non-zero but became zero due to conversion
//                 utilizationRatio = 1 - (tlNum / tdNum);
//             }
//         }
        
//         // TODO: Implement your actual APY calculation logic based on utilization ratio
//         const baseInterestRate = 0.05; // 5% base rate (example)
//         const apy = utilizationRatio * baseInterestRate * 100; // As a percentage

//         return NextResponse.json({
//             apy: apy.toFixed(2) + '%',
//             utilizationRatio: (utilizationRatio * 100).toFixed(2) + '%',
//             totalLiquidity: totalLiquidity.toString(),
//             totalDeposits: totalDeposits.toString(),
//         });
//     } catch (error) {
//         console.error('Error in /api/apy:', error);
//         return NextResponse.json({ error: 'Failed to calculate APY.' }, { status: 500 });
//     }
// } 