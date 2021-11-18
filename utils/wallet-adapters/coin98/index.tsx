/* eslint-disable */
import EventEmitter from "eventemitter3";
import { PublicKey, Transaction } from "@solana/web3.js";
import { DEFAULT_PUBLIC_KEY, WalletAdapter } from "../types";
import bs58 from "bs58";

type Coin98Event = "disconnect" | "connect";

interface Coin98Provider {
  publicKey?: PublicKey;
  isConnected?: boolean;
  autoApprove?: boolean;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  connect: () => Promise<Boolean>;
  disconnect: () => Promise<void>;
  on: (event: Coin98Event, handler: (args: any) => void) => void;
  request: (arg: any) => Promise<any>;
}

export class Coin98ExtensionWalletAdapter
  extends EventEmitter
  implements WalletAdapter
{
  _provider: Coin98Provider | undefined;
  constructor() {
    super();
    this.connect = this.connect.bind(this);
  }

  get connected() {
    return this._provider?.isConnected || false;
  }

  get autoApprove() {
    return false;
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    if (!this._provider) {
      return transactions;
    }

    const result: Transaction[] = [];
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      if (transaction) {
        const signed = await this.signTransaction(transaction);
        result.push(signed);
      }
    }
    return result;
  }

  get publicKey() {
    return this._provider?.publicKey || DEFAULT_PUBLIC_KEY;
  }

  async signTransaction(transaction: Transaction) {
    if (!this._provider) {
      return transaction;
    }

    const { publicKey, signature } = (await this._provider.request({
      method: "sol_sign",
      params: [transaction],
    })) as { publicKey: string; signature: string };
    transaction.addSignature(new PublicKey(publicKey), bs58.decode(signature));
    return transaction;
  }

  connect = async () => {
    if (this._provider) {
      return;
    }

    let provider: Coin98Provider;
    if ((window as any)?.ethereum?.isCoin98 || (window as any)?.coin98) {
      provider = (window as any).coin98.sol;
      provider
        .request({ method: "sol_accounts" })
        .then((rawAccounts: string[]) => {
          const accounts = rawAccounts;
          if (!accounts[0]) {
            throw new Error("No accounts found.");
          }
          this._provider = provider;
          this._provider.publicKey = new PublicKey(accounts[0]);
          this._provider.isConnected = true;
          this.emit("connect");
        })
        .catch(() => {
          this.disconnect();
        });
    } else {
      window.open("https://coin98.com/", "_blank");
      return;
    }

    provider.on("connect", () => {
      this._provider = provider;
    });
  };

  disconnect() {
    if (this._provider) {
      this._provider.disconnect();
      this._provider = undefined;
      this.emit("disconnect");
    }
  }
}
