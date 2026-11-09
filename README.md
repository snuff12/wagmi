# Wagmi WalletConnect initialization recovery reproduction

This example uses the published `@wagmi/core@3.6.9`, `@wagmi/connectors@8.2.4` and real `@walletconnect/ethereum-provider@2.26.0`. It needs Node.js 22 or newer. SDK initialization is not replaced by a mock.

```sh
npm install --ignore-scripts --omit=optional --legacy-peer-deps
npm run repro
```

A supported custom storage implementation throws exactly once when UniversalProvider reads namespace state. Every later read would succeed. Wagmi's own config storage is disabled to isolate WalletConnect storage.

The pinned connector fails all three `getProvider()` calls with the same storage error and reads namespace state only once. Direct EthereumProvider initialization with the same recovered storage succeeds. The example exits 1 when every connector attempt fails.

Expected behavior: after the first initialization rejection, a later call retries initialization and succeeds. Successful and concurrent initialization should still be shared.

The relay and RPC URLs are loopback addresses. The scenario performs initialization only; it does not connect a wallet, request a signature or send a transaction. The placeholder project ID is sufficient for this local initialization path. WalletConnect can print an existing-Core warning when the direct initialization control reuses its Core instance.
