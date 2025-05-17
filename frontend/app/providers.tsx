'use client';

import { createNetworkConfig,
         SuiClientProvider,
         WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // Creating the QueryClient **inside** the client component avoids
  // the "Only plain objects…" RSC error.
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5_000 } } });

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="devnet">
        <WalletProvider autoConnect>
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
