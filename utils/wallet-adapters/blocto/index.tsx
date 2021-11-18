/* eslint-disable */
import EventEmitter from "eventemitter3";
import { PublicKey, Transaction } from "@solana/web3.js";
import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";

type BloctoEvent = "disconnect" | "connect";
type BloctoRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions";

interface BloctoProvider {
  isProgramWallet: boolean;
  publicKey?: PublicKey;
  isConnected: boolean;
  autoApprove: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  convertToProgramWalletTransaction: (
    transaction: Transaction
  ) => Promise<Transaction>;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  on: (event: BloctoEvent, handler: (args: any) => void) => void;
  request: (method: BloctoRequestMethod, params: any) => Promise<any>;
}

export class BloctoWalletAdapter extends EventEmitter implements WalletAdapter {
  _provider: BloctoProvider | undefined;
  constructor() {
    super();
    this.connect = this.connect.bind(this);
  }

  get isProgramWallet() {
    return true;
  }

  get connected() {
    return this._provider?.isConnected || false;
  }

  get autoApprove() {
    return this._provider?.autoApprove || false;
  }

  // eslint-disable-next-line
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

  // eslint-disable-next-line
  async signTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction;
    }

    return this._provider.signTransaction(transaction);
  }

  async convertToProgramWalletTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction;
    }

    return await this._provider.convertToProgramWalletTransaction(transaction);
  }

  async signAndSendTransaction(transaction: Transaction) {
    if (!this._provider) {
      throw new Error("no Blocto provider");
    }

    return await this._provider.signAndSendTransaction(transaction);
  }

  connect = async () => {
    if (this._provider) {
      return;
    }

    let provider: BloctoProvider;
    if ((window as any)?.solana?.isBlocto) {
      provider = (window as any).solana;
    } else {
      window.open("https://blocto.portto.io/", "_blank");
      return;
    }

    provider.on("connect", () => {
      this._provider = provider;
      this.emit("connect");
    });

    if (!provider.isConnected) {
      await provider.connect();
    }

    this._provider = provider;
    this.emit("connect");
  };

  disconnect() {
    if (this._provider) {
      this._provider.disconnect();
      this._provider = undefined;
      this.emit("disconnect");
    }
  }
}
