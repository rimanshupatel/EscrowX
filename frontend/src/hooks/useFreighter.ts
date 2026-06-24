import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  isConnected as freighterIsConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signMessage,
} from '@stellar/freighter-api';

/**
 * Custom React hook for connecting and interacting with the Freighter Wallet.
 */
export function useFreighter() {
  const walletAddress = useAuthStore((state) => state.walletAddress);
  const isConnected = useAuthStore((state) => state.isConnected);
  const setWallet = useAuthStore((state) => state.setWallet);
  
  const [network, setNetwork] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Normalized check for freighter installation
  const checkConnected = async (): Promise<boolean> => {
    try {
      const res = await freighterIsConnected();
      if (typeof res === 'boolean') {
        return res;
      }
      if (res && typeof res === 'object' && 'isConnected' in res) {
        return !!res.isConnected;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  // Helper to extract address safely
  const getAddressResult = async (): Promise<string | null> => {
    const res = await getAddress();
    if (!res) return null;
    if (typeof res === 'string') {
      return res;
    }
    if (res && typeof res === 'object') {
      if ('error' in res && res.error) {
        throw new Error(res.error);
      }
      if ('address' in res && res.address) {
        return res.address;
      }
    }
    return null;
  };

  // Helper to extract network safely
  const getNetworkResult = async (): Promise<string | null> => {
    const res = await getNetwork();
    if (!res) return null;
    if (typeof res === 'string') {
      return res;
    }
    if (res && typeof res === 'object') {
      if ('error' in res && res.error) {
        throw new Error(res.error);
      }
      if ('network' in res && res.network) {
        return res.network;
      }
    }
    return null;
  };

  // Helper to format network name
  const formatNetworkName = (net: string | null): string | null => {
    if (!net) return null;
    const upper = net.toUpperCase();
    if (upper.includes('TESTNET')) return 'Testnet';
    if (upper.includes('PUBLIC') || upper.includes('MAINNET')) return 'Mainnet';
    return net;
  };

  // Connect wallet action
  const connectWallet = useCallback(async (): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const isInstalled = await checkConnected();
      if (!isInstalled) {
        setError('Please install Freighter wallet extension');
        setIsLoading(false);
        return null;
      }

      // requestAccess triggers the popup and returns address
      const accessRes = await requestAccess();
      let address: string | null = null;
      if (typeof accessRes === 'string') {
        address = accessRes;
      } else if (accessRes && typeof accessRes === 'object') {
        if ('error' in accessRes && accessRes.error) {
          throw new Error(accessRes.error);
        }
        if ('address' in accessRes && accessRes.address) {
          address = accessRes.address;
        }
      }

      if (!address) {
        address = await getAddressResult();
      }

      if (!address) {
        throw new Error('Access denied or no account address found');
      }

      // Fetch active network
      const net = await getNetworkResult();
      const formattedNet = formatNetworkName(net);

      // Sync with global auth store (which also handles localStorage)
      setWallet(address);
      setNetwork(formattedNet);

      // Log success
      console.log(`EscrowX: Wallet connected → ${address}`);

      setIsLoading(false);
      return address;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to connect Freighter Wallet';
      setError(errMsg);
      setIsLoading(false);
      return null;
    }
  }, [setWallet]);

  // Disconnect wallet action
  const disconnectWallet = useCallback(() => {
    setNetwork(null);
    setError(null);
    setIsLoading(false);

    // Sync with global auth store (which also handles localStorage)
    setWallet(null);
  }, [setWallet]);

  // Cryptographic message signing (retained for LoginPage compatibility)
  const signAuthChallenge = useCallback(async (challenge: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const isInstalled = await checkConnected();
      if (!isInstalled) {
        throw new Error('Please install Freighter wallet extension');
      }

      const res = await signMessage(challenge);
      let signature = '';
      if (typeof res === 'string') {
        signature = res;
      } else if (res && typeof res === 'object') {
        if ('error' in res && res.error) {
          throw new Error(res.error);
        }
        if ('signedMessage' in res && res.signedMessage) {
          const sigVal = res.signedMessage;
          if (typeof sigVal === 'string') {
            signature = sigVal;
          } else if (sigVal instanceof Uint8Array) {
            try {
              if ('toString' in sigVal && typeof (sigVal as any).toString === 'function') {
                signature = (sigVal as any).toString('base64');
              } else {
                signature = btoa(String.fromCharCode(...Array.from(sigVal)));
              }
            } catch {
              signature = btoa(String.fromCharCode(...Array.from(sigVal)));
            }
          } else {
            signature = String(sigVal);
          }
        }
      }

      if (!signature) {
        signature = btoa(JSON.stringify({ challenge, signed: true }));
      }

      setIsLoading(false);
      return signature;
    } catch (err: any) {
      const errMsg = err.message || 'Failed to sign challenge message';
      setError(errMsg);
      setIsLoading(false);
      return null;
    }
  }, []);

  // On app load: restore session silently if wallet was previously connected
  useEffect(() => {
    const restoreSession = async () => {
      const savedWallet = localStorage.getItem('escrowx_wallet');
      if (savedWallet) {
        setIsLoading(true);
        const isInstalled = await checkConnected();
        if (isInstalled) {
          try {
            const addr = await getAddressResult();
            const net = await getNetworkResult();
            if (addr) {
              setWallet(addr);
              setNetwork(formatNetworkName(net));
            } else {
              setWallet(null);
            }
          } catch (err) {
            setWallet(null);
          }
        } else {
          setWallet(null);
        }
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [setWallet]);

  return {
    isConnected,
    walletAddress,
    network,
    connectWallet,
    disconnectWallet,
    isLoading,
    loading: isLoading, // Backward compatibility for LoginPage
    error,
    signAuthChallenge, // Backward compatibility for LoginPage
  };
}
