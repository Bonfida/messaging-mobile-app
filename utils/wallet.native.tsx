import React, { useContext, useState, useEffect, useRef } from "react";
import {
  AccountInfo,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { useConnection } from "./connection";
import { useAsync } from "./utils.native";
import * as SecureStore from "expo-secure-store";
import "text-encoding-polyfill";
import { entropyToMnemonic } from "@ethersproject/hdnode";
import * as Random from "expo-random";
import { ISendTransaction } from "./send.native";
import { sendTransaction } from "./send.native";
import bs58 from "bs58";
import { IStep } from "../types";

export const loadKeyPairFromMnemonicOrPrivateKey = async (
  input: string
): Promise<[Keypair | undefined, string | undefined]> => {
  let account: Keypair | undefined = undefined;
  let normalized: string | undefined = undefined;
  if (input.startsWith("[")) {
    // Load from private key
    const privatKey = JSON.parse(input) as number[];
    account = Keypair.fromSecretKey(new Uint8Array(privatKey));
    normalized = input;
  } else if (input.split(" ").length === 24) {
    // Load from mnemonic
    normalized = normalizeMnemonic(input);
    const seed = await bip39.mnemonicToSeed(normalized);
    account = getAccountFromSeed(seed.toString("hex"));
  } else {
    // For Phantom wallet
    const decoded = bs58.decode(input.trim());
    account = Keypair.fromSecretKey(decoded);
    normalized = input;
  }
  return [account, normalized];
};

interface IContext {
  wallet: Keypair | undefined;
  walletLoaded: boolean;
  refresh: () => void;
  sendTransaction: (params: ISendTransaction) => Promise<string>;
  hasSol: () => Promise<boolean>;
  solBalance: number | null;
  created: boolean;
  setCreated: (arg: boolean) => Promise<void>;
  step: IStep;
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}

const WalletContext: React.Context<null | IContext> =
  React.createContext<null | IContext>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const connection = useConnection();
  const [solBalance, setSolBalance] = useState(0);
  const [refresh, setRefresh] = useState(false);
  const [step, setStep] = useState(IStep.Welcome);

  const load = async () => {
    // Getting stored mnemonic
    const mnemonic = await SecureStore.getItemAsync("mnemonic");
    if (!mnemonic) {
      // No mnemonic stored
      return;
    }
    const normalized = normalizeMnemonic(mnemonic);
    const [account] = await loadKeyPairFromMnemonicOrPrivateKey(normalized);
    return account;
  };

  const [wallet, walletLoading] = useAsync(load, refresh);

  const hasSol = async () => {
    if (!wallet) return false;
    const _balance = await connection.getBalance(wallet?.publicKey);
    setSolBalance(_balance / LAMPORTS_PER_SOL);
    return _balance > 0;
  };

  const loadCreated = async () => {
    const created = await SecureStore.getItemAsync("created");
    if (!created) {
      return false;
    }
    return JSON.stringify(created);
  };

  const setCreated = async (arg: boolean) => {
    await SecureStore.setItemAsync("created", JSON.stringify(arg));
  };

  const [created] = useAsync(loadCreated, refresh);

  const loaded = !walletLoading;
  return (
    <WalletContext.Provider
      value={{
        wallet,
        walletLoaded: loaded,
        refresh: () => setRefresh((prev) => !prev),
        sendTransaction: sendTransaction,
        hasSol,
        solBalance,
        created: !!created,
        setCreated,
        step,
        setStep,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("Missing wallet context");
  }
  return {
    wallet: context.wallet,
    walletLoaded: context.walletLoaded,
    refresh: context.refresh,
    sendTransaction: context.sendTransaction,
    hasSol: context.hasSol,
    solBalance: context.solBalance,
    created: context.created,
    setCreated: context.setCreated,
    step: context.step,
    setStep: context.setStep,
  };
}

export const normalizeMnemonic = (mnemonic: string) => {
  return mnemonic.trim().split(/\s+/g).join(" ");
};

/** Use standard path */
export const getAccountFromSeed = (seed: string) => {
  const path = `m/44'/501'/0'/0'`;
  const derivedSeed = derivePath(path, seed).key;
  return Keypair.fromSeed(derivedSeed);
};

export const useBalance = (refresh: boolean) => {
  const { wallet } = useWallet();
  const connection = useConnection();

  const fn = async () => {
    if (!wallet || !connection) return;
    const response = await connection.getBalance(wallet.publicKey);
    return response / LAMPORTS_PER_SOL;
  };

  return useAsync(fn, refresh != !!wallet);
};

export const generateMnemonicAndSeed = async () => {
  const randomBytes = await Random.getRandomBytesAsync(32);
  const mnemonic = entropyToMnemonic(randomBytes);
  const seed = await bip39.mnemonicToSeed(normalizeMnemonic(mnemonic));
  return { mnemonic, seed: Buffer.from(seed).toString("hex") };
};

export const useBalanceWs = (address: PublicKey | undefined) => {
  const connection = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const mountedRef = useRef(true);
  const loadedRef = useRef(false);
  const idRef = useRef<null | number>(null);
  const addressRef = useRef(address);

  const callback = async (accountInfo: AccountInfo<Buffer>) => {
    setBalance(accountInfo.lamports / LAMPORTS_PER_SOL);
  };

  useEffect(() => {
    if (!address) return;
    if (addressRef.current?.equals(address)) {
      mountedRef.current = true;
      loadedRef.current = false;
    }
    const load = async () => {
      if (loadedRef.current) return;
      const lamports = await connection.getBalance(address);
      if (!mountedRef.current) return;
      setBalance(lamports / LAMPORTS_PER_SOL);
      loadedRef.current = true;
    };

    // Load first time
    load();

    // Subscribe to websocket
    const id = connection.onAccountChange(address, callback);
    idRef.current = id;

    // Unsubscribe and useEffect cleanup
    return () => {
      mountedRef.current = false;
      if (idRef.current !== null) {
        connection
          .removeAccountChangeListener(idRef.current)
          .then(() => console.log("Unsubscribe"));
      }
    };
  }, [address?.toBase58()]);

  return balance;
};
