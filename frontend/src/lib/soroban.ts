import {
  Contract,
  rpc as SorobanRpc,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  nativeToScVal,
  Address,
  scValToNative,
  xdr,
  Account,
} from '@stellar/stellar-sdk';
import { STELLAR_CONFIG } from '../config/stellar.config';
import { OnChainEscrowStatus } from './types';

/**
 * The native XLM token contract address on Stellar Testnet.
 */
export const XLM_TOKEN_ADDRESS = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';

/**
 * Number of stroops in 1 XLM (10,000,000).
 */
export const STROOPS_PER_XLM = 10_000_000;

/**
 * Interface representing the escrow record structure retrieved from the smart contract.
 */
export interface EscrowOnChain {
  escrow_id: string;
  client: string;
  freelancer: string;
  amount: bigint;
  token: string;
  status: OnChainEscrowStatus;
  created_at: number;
  deadline: number;
}

/**
 * Parses a string escrowId into a u64 bigint deterministically.
 * If the string format is esc_XXXXX (where XXXXX is numeric), it parses the number directly.
 * Otherwise, it hashes the string to a unique 64-bit bigint.
 * 
 * @param escrowId - The escrow ID string to parse.
 * @returns A bigint representing the u64 on-chain ID.
 */
export function parseEscrowIdToBigInt(escrowId: string): bigint {
  const digits = escrowId.replace(/\D/g, '');
  if (!digits) {
    let hash = 0n;
    for (let i = 0; i < escrowId.length; i++) {
      hash = (hash * 31n + BigInt(escrowId.charCodeAt(i))) & 0xFFFFFFFFFFFFFFFFn;
    }
    return hash;
  }
  return BigInt(digits);
}

/**
 * Parses any error into a human-readable contract error name.
 * 
 * @param err - The raw error object/string from contract simulation/execution.
 * @returns A human-readable error status string.
 */
export function parseContractError(err: any): string {
  const msg = err?.message || String(err);
  if (msg.includes('Error(Contract, #1)') || msg.includes('#1')) {
    return 'Unauthorized';
  }
  if (msg.includes('Error(Contract, #2)') || msg.includes('#2')) {
    return 'InvalidState';
  }
  if (msg.includes('Error(Contract, #3)') || msg.includes('#3')) {
    return 'EscrowNotFound';
  }
  if (msg.includes('Error(Contract, #4)') || msg.includes('#4')) {
    return 'AlreadyFunded';
  }
  if (msg.includes('Error(Contract, #5)') || msg.includes('#5')) {
    return 'TransferFailed';
  }
  if (msg.includes('User rejected') || msg.includes('cancelled') || msg.includes('declined') || msg.includes('cancel')) {
    return 'WalletRejected';
  }
  if (msg.includes('SimulationFailed') || msg.includes('simulation failed') || msg.includes('simulation')) {
    return 'SimulationFailed';
  }
  if (msg.includes('NetworkFailure') || msg.includes('network error') || msg.includes('timeout') || msg.includes('Horizon')) {
    return 'NetworkFailure';
  }
  return msg;
}

function addressToScVal(address: string): xdr.ScVal {
  return Address.fromString(address).toScVal();
}

function xlmToI128ScVal(xlm: number): xdr.ScVal {
  return nativeToScVal(BigInt(Math.round(xlm * STROOPS_PER_XLM)), { type: 'i128' });
}

/**
 * Creates a new escrow on-chain.
 */
export async function createEscrow(
  escrowId: string,
  clientAddress: string,
  freelancerAddress: string,
  amountXLM: number
): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(clientAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'create_escrow',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' }),
    addressToScVal(clientAddress),
    addressToScVal(freelancerAddress),
    xlmToI128ScVal(amountXLM)
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Funds an existing escrow on-chain.
 */
export async function fundEscrow(escrowId: string, clientAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(clientAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'fund_escrow',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Marks the escrow in progress.
 */
export async function markInProgress(escrowId: string, callerAddress: string, freelancerAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(callerAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'mark_in_progress',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' }),
    addressToScVal(freelancerAddress)
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Marks the escrow as delivered.
 */
export async function markDelivered(escrowId: string, freelancerAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(freelancerAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'mark_delivered',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Approves the delivery, releasing the funds.
 */
export async function approveDelivery(escrowId: string, clientAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(clientAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'approve_delivery',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Requests a refund from the freelancer.
 */
export async function requestRefund(escrowId: string, clientAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(clientAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'request_refund',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Refunds the escrow.
 */
export async function refundEscrow(escrowId: string, clientAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(clientAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'refund_escrow',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Raises a dispute.
 */
export async function raiseDispute(escrowId: string, callerAddress: string): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(callerAddress);

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'raise_dispute',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' }),
    addressToScVal(callerAddress)
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Resolves a dispute.
 */
export async function resolveDispute(
  escrowId: string,
  adminAddress: string,
  releaseToFreelancer: boolean
): Promise<string> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const account = await server.getAccount(adminAddress);

  const escrow = await getEscrow(escrowId);
  const winnerAddress = releaseToFreelancer ? escrow.freelancer : escrow.client;

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'resolve_dispute',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' }),
    addressToScVal(winnerAddress)
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  return preparedTx.toXDR();
}

/**
 * Gets details of an escrow on-chain.
 */
export async function getEscrow(escrowId: string): Promise<EscrowOnChain> {
  const server = new SorobanRpc.Server(STELLAR_CONFIG.RPC_URL);
  const dummyPublicKey = 'GDGSHBO7VF2E6ZUB2DLGOBBRQUNNLL3V6M7JQEUUT6SEJOTEPAIGLMMX';
  const account = new Account(dummyPublicKey, '0');

  const op = new Contract(STELLAR_CONFIG.CONTRACT_ID).call(
    'get_escrow',
    nativeToScVal(parseEscrowIdToBigInt(escrowId), { type: 'u64' })
  );

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(parseContractError(simResult.error));
  }

  if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
    throw new Error('Simulation did not succeed');
  }

  if (!simResult.result?.retval) {
    throw new Error('No return value from contract simulation');
  }

  const native = scValToNative(simResult.result.retval);
  
  const statusMap: OnChainEscrowStatus[] = [
    'PENDING',
    'FUNDED',
    'IN_PROGRESS',
    'DELIVERED',
    'REVISION_REQUESTED',
    'APPROVED',
    'DISPUTED',
    'REFUNDED',
    'COMPLETED',
  ];
  
  const statusIdx = typeof native.status === 'number' ? native.status : Number(native.status);
  const statusStr = statusMap[statusIdx] || 'PENDING';

  return {
    escrow_id: escrowId,
    client: native.client,
    freelancer: native.freelancer,
    amount: native.amount,
    token: XLM_TOKEN_ADDRESS,
    status: statusStr,
    created_at: Date.now(),
    deadline: 0,
  };
}

export const sorobanClient = {
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
};
