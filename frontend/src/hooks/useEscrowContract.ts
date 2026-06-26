import { useState } from 'react';
import { signTransaction } from '@stellar/freighter-api';
import { Horizon, TransactionBuilder, Networks } from '@stellar/stellar-sdk';
import axios from 'axios';
import { STELLAR_CONFIG } from '../config/stellar.config';
import { sorobanClient, parseContractError, EscrowOnChain } from '../lib/soroban';
import { ContractResponse } from '../lib/types';

/**
 * Custom React hook for executing Soroban escrow smart contract functions
 * and synchronizing successful transactions with the platform backend.
 */
export function useEscrowContract() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const getAuthToken = (): string => {
    return localStorage.getItem('token') || localStorage.getItem('escrowx_token') || '';
  };

  const getHeaders = () => {
    const token = getAuthToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  /**
   * Helper to sign and submit a prepared Soroban transaction XDR.
   */
  async function signAndSubmitTx(preparedXdr: string, userAddress: string): Promise<string> {
    // 1. Sign using Freighter
    let signedXdr: string;
    try {
      const res = await signTransaction(preparedXdr, {
        networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
      });
      if (!res) {
        throw new Error('WalletRejected');
      }
      if (res.error) {
        throw new Error(res.error);
      }
      signedXdr = res.signedTxXdr;
    } catch (err: any) {
      throw new Error(parseContractError(err));
    }

    // 2. Submit to Horizon
    try {
      const server = new Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
      const submittedTx = await server.submitTransaction(
        TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET)
      );
      return submittedTx.hash;
    } catch (err: any) {
      throw new Error(parseContractError(err));
    }
  }

  /**
   * Deploys and creates a new escrow on-chain.
   */
  async function createEscrow(
    escrowId: string,
    clientAddress: string,
    freelancerAddress: string,
    amountXLM: number,
    backendData?: { jobId?: string; listingId?: string; deadline: string; freelancerId?: string }
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.createEscrow(
        escrowId,
        clientAddress,
        freelancerAddress,
        amountXLM
      );

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, clientAddress);
      setTxHash(hash);

      // Sync with backend if details are provided
      if (backendData) {
        await axios.post(
          'http://localhost:5000/api/escrows',
          {
            jobId: backendData.jobId,
            listingId: backendData.listingId,
            contractId: escrowId,
            arbitratorAddress: STELLAR_CONFIG.CONTRACT_ID,
            amount: amountXLM,
            deadline: backendData.deadline,
            txHash: hash,
            freelancerId: backendData.freelancerId,
          },
          getHeaders()
        );
      }

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Funds an existing escrow on-chain.
   */
  async function fundEscrow(
    escrowId: string,
    clientAddress: string,
    backendEscrowId: string
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.fundEscrow(escrowId, clientAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, clientAddress);
      setTxHash(hash);

      // Sync with backend
      await axios.put(
        `http://localhost:5000/api/escrows/${backendEscrowId}/fund`,
        { txHash: hash },
        getHeaders()
      );

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Marks the project as in-progress.
   */
  async function markInProgress(
    escrowId: string,
    callerAddress: string,
    freelancerAddress: string,
    backendEscrowId?: string
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.markInProgress(escrowId, callerAddress, freelancerAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, callerAddress);
      setTxHash(hash);

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Marks the project as delivered.
   */
  async function markDelivered(
    escrowId: string,
    freelancerAddress: string,
    backendEscrowId: string,
    deliveryData: { ipfsHash: string; githubLink?: string; notes: string; previewFiles?: string[] },
    isProjectDelivery: boolean = false
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.markDelivered(escrowId, freelancerAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, freelancerAddress);
      setTxHash(hash);

      // Sync with backend
      if (isProjectDelivery) {
        await axios.post(
          `http://localhost:5000/api/deliveries/${backendEscrowId}/submit`,
          {
            notes: deliveryData.notes,
            demoLink: deliveryData.githubLink || '',
            files: [deliveryData.ipfsHash],
            previewFiles: deliveryData.previewFiles || [],
            txHash: hash,
          },
          getHeaders()
        );
      } else {
        await axios.post(
          `http://localhost:5000/api/escrows/${backendEscrowId}/deliver`,
          {
            ...deliveryData,
            txHash: hash,
          },
          getHeaders()
        );
      }

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Approves delivery, releasing funds.
   */
  async function approveDelivery(
    escrowId: string,
    clientAddress: string,
    backendEscrowId: string,
    isProjectDelivery: boolean = false
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.approveDelivery(escrowId, clientAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, clientAddress);
      setTxHash(hash);

      // Sync with backend
      if (isProjectDelivery) {
        await axios.put(
          `http://localhost:5000/api/deliveries/${backendEscrowId}/approve`,
          { txHash: hash },
          getHeaders()
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/escrows/${backendEscrowId}/approve`,
          { txHash: hash },
          getHeaders()
        );
      }

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Requests a refund.
   */
  async function requestRefund(
    escrowId: string,
    clientAddress: string,
    backendEscrowId: string,
    reason: string = '',
    isProjectDelivery: boolean = false
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.requestRefund(escrowId, clientAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, clientAddress);
      setTxHash(hash);

      // Sync with backend
      if (isProjectDelivery) {
        await axios.put(
          `http://localhost:5000/api/deliveries/${backendEscrowId}/reject`,
          { reason, txHash: hash },
          getHeaders()
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/escrows/${backendEscrowId}/refund`,
          { txHash: hash },
          getHeaders()
        );
      }

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Performs client-authorized refund.
   */
  async function refundEscrow(
    escrowId: string,
    clientAddress: string,
    backendEscrowId: string,
    isProjectDelivery: boolean = false
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.refundEscrow(escrowId, clientAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, clientAddress);
      setTxHash(hash);

      // Sync with backend (sets state to REFUNDED)
      if (isProjectDelivery) {
        await axios.put(
          `http://localhost:5000/api/deliveries/${backendEscrowId}/refund`,
          { txHash: hash },
          getHeaders()
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/escrows/${backendEscrowId}/refund`,
          { txHash: hash },
          getHeaders()
        );
      }

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Raises a dispute.
   */
  async function raiseDispute(
    escrowId: string,
    callerAddress: string,
    backendEscrowId: string,
    reason: string
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.raiseDispute(escrowId, callerAddress);

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, callerAddress);
      setTxHash(hash);

      // Sync with backend
      await axios.post(
        'http://localhost:5000/api/disputes',
        {
          escrowId: backendEscrowId,
          reason,
          evidenceContent: `Dispute raised on-chain. Tx Hash: ${hash}. Reason: ${reason}`,
        },
        getHeaders()
      );

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Resolves a dispute.
   */
  async function resolveDispute(
    escrowId: string,
    adminAddress: string,
    releaseToFreelancer: boolean,
    backendDisputeId: string,
    totalEscrowAmount: number
  ): Promise<ContractResponse<string>> {
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Build and simulate
      const preparedXdr = await sorobanClient.resolveDispute(
        escrowId,
        adminAddress,
        releaseToFreelancer
      );

      // Sign and submit
      const hash = await signAndSubmitTx(preparedXdr, adminAddress);
      setTxHash(hash);

      // Sync with backend
      await axios.put(
        `http://localhost:5000/api/disputes/${backendDisputeId}/resolve`,
        {
          clientPayout: releaseToFreelancer ? 0 : totalEscrowAmount,
          freelancerPayout: releaseToFreelancer ? totalEscrowAmount : 0,
          arbitratorNotes: `Dispute resolved on-chain. Release to freelancer: ${releaseToFreelancer}.`,
          resolution: `Dispute settled. Winner: ${releaseToFreelancer ? 'FREELANCER' : 'CLIENT'}.`,
          txHash: hash,
        },
        getHeaders()
      );

      setLoading(false);
      return { success: true, txHash: hash, data: hash };
    } catch (err: any) {
      const mappedError = parseContractError(err);
      setError(mappedError);
      setLoading(false);
      return { success: false, error: mappedError };
    }
  }

  /**
   * Retrieves on-chain state of an escrow.
   */
  async function getEscrow(escrowId: string): Promise<EscrowOnChain | null> {
    setLoading(true);
    setError(null);
    try {
      const escrow = await sorobanClient.getEscrow(escrowId);
      setLoading(false);
      return escrow;
    } catch (err: any) {
      setError(parseContractError(err));
      setLoading(false);
      return null;
    }
  }

  return {
    createEscrow,
    fundEscrow,
    markInProgress,
    markDelivered,
    approveDelivery,
    requestRefund,
    refundEscrow,
    raiseDispute,
    resolveDispute,
    getEscrow,
    loading,
    error,
    txHash,
  };
}
