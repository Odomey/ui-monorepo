'use client'

import {
  connectorsForWallets,
  RainbowKitProvider,
  lightTheme,
  type Locale,
} from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { evmNetworks } from 'app/networks'
import { http } from 'viem'
import { WagmiProvider, createConfig } from 'wagmi'

type Props = {
  children: React.ReactNode
  locale: Locale
}

const queryClient = new QueryClient()

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Wallets',
      wallets: [metaMaskWallet],
    },
  ],
  {
    // These values are required but not actually used, unless wallet connect is enabled
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
  },
)

export const evmWalletConfig = createConfig({
  chains: evmNetworks,
  connectors,
  transports: Object.fromEntries(
    evmNetworks.map(n => [
      n.id,
      http(n.rpcUrls.default.http[0], {
        batch: { wait: 1000 },
      }),
    ]),
  ),
})

export const EvmWalletContext = ({ children, locale }: Props) => (
  <WagmiProvider config={evmWalletConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider
        locale={locale as Locale}
        theme={lightTheme({
          accentColor: 'black',
        })}
      >
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
)