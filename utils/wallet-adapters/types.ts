import { PublicKey, Transaction } from "@solana/web3.js";

export const DEFAULT_PUBLIC_KEY = new PublicKey(
  "11111111111111111111111111111111"
);

export interface WalletAdapter {
  publicKey: PublicKey;
  autoApprove: boolean;
  connected: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transaction: Transaction[]) => Promise<Transaction[]>;
  connect: () => void;
  disconnect: () => void;
  on(event: string, fn: () => void): this;
}
