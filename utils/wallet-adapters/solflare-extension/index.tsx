/* eslint-disable */
import EventEmitter from "eventemitter3";
import { PublicKey, Transaction } from "@solana/web3.js";
import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";

type SolflareExtensionEvent = "disconnect" | "connect";
type SolflareExtensionRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

interface SolflareExtensionProvider {
  publicKey?: PublicKey;
  isConnected?: boolean;
  autoApprove?: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<Boolean>;
  disconnect: () => Promise<void>;
  on: (event: SolflareExtensionEvent, handler: (args: any) => void) => void;
  off: (event: SolflareExtensionEvent, handler: (args: any) => void) => void;
  request: (
    method: SolflareExtensionRequestMethod,
    params: any
  ) => Promise<any>;
}

export class SolflareExtensionWalletAdapter
  extends EventEmitter
  implements WalletAdapter
{
  _provider: SolflareExtensionProvider | undefined;
  constructor() {
    super();
    this.connect = this.connect.bind(this);
  }

  get connected() {
    return this._provider?.isConnected || false;
  }

  get autoApprove() {
    return this._provider?.autoApprove || false;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions;
    }

    return this._provider.signAllTransactions(transactions);
  }

  get publicKey() {
    return this._provider?.publicKey || DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction;
    }

    return this._provider.signTransaction(transaction);
  }

  connect = async () => {
    if (this._provider) {
      return;
    }

    let provider: SolflareExtensionProvider;
    if ((window as any)?.solflare?.isSolflare) {
      provider = (window as any).solflare;
    } else {
      window.open("https://solflare.com/", "_blank");
      return;
    }

    const connectionHandler = () => {
      this._provider = provider;
      this.emit("connect");
    };

    provider.on("connect", connectionHandler);
    provider.on("disconnect", () => {
      provider.off("connect", connectionHandler);
    });

    if (!provider.isConnected) {
      if (!(await provider.connect())) {
        console.log({
          message: "Solflare Error - connection rejected by user",
          variant: "error",
        });
      }
    }
  };

  disconnect() {
    if (this._provider) {
      this._provider.disconnect();
      this._provider = undefined;
      this.emit("disconnect");
    }
  }
}
