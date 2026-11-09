import { createConfig, http } from '@wagmi/core';
import { mainnet } from '@wagmi/core/chains';
import { walletConnect } from '@wagmi/connectors';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

const entries = new Map();
let firstNamespaceRead = true;
let namespaceReads = 0;
const storage = {
  async getItem(key) {
    if (key.startsWith('wc@2:universal_provider:')) {
      namespaceReads++;
      if (firstNamespaceRead) {
        firstNamespaceRead = false;
        throw new Error('temporary storage failure');
      }
    }
    return entries.get(key);
  },
  async setItem(key, value) { entries.set(key, value); },
  async removeItem(key) { entries.delete(key); },
  async getKeys() { return [...entries.keys()]; },
  async getEntries() { return [...entries.entries()]; }
};
const options = {
  projectId: '0'.repeat(32), storage, logger: 'silent', showQrModal: false,
  telemetryEnabled: false, disableProviderPing: true,
  relayUrl: 'ws://127.0.0.1:1', customStoragePrefix: 'wagmi-init-recovery-repro',
  metadata: { name: 'Local reproduction', description: 'Local reproduction', url: 'http://localhost', icons: [] }
};
const config = createConfig({
  chains: [mainnet], connectors: [walletConnect(options)],
  transports: { [mainnet.id]: http('http://127.0.0.1:1') },
  storage: null, multiInjectedProviderDiscovery: false
});

const results = [];
let control;
try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await config.connectors[0].getProvider();
      results.push({ attempt, result: 'initialized' });
    } catch (error) {
      results.push({ attempt, error: error.message });
    }
  }
  console.log(JSON.stringify({ results, namespaceReadsBeforeControl: namespaceReads }, null, 2));
  control = await EthereumProvider.init({ ...options, optionalChains: [1] });
  console.log('Direct SDK initialization with recovered storage:', control.chainId === 1);
  process.exitCode = results.every(result => result.error) ? 1 : 0;
} finally {
  if (control) {
    await control.signer.client.core.relayer.transportClose();
    control.signer.client.core.heartbeat.stop();
  }
}
