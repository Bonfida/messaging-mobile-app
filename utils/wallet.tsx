import React, { useContext, useState } from "react";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { useConnection } from "./connection";
import { useAsync } from "./utils";
import * as SecureStore from "expo-secure-store";
import "text-encoding-polyfill";

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
  } else {
    // Load from mnemonic
    normalized = normalizeMnemonic(input);
    const seed = await bip39.mnemonicToSeed(normalized);
    account = getAccountFromSeed(seed.toString("hex"));
  }
  return [account, normalized];
};

interface IContext {
  wallet: Keypair | undefined;
  walletLoaded: boolean;
  refresh: () => void;
}

const WalletContext: React.Context<null | IContext> =
  React.createContext<null | IContext>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [refresh, setRefresh] = useState(false);

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

  const [wallet, walletLoading] = useAsync(load, refresh, 30 * 1_000);
  const loaded = !walletLoading;
  return (
    <WalletContext.Provider
      value={{
        wallet,
        walletLoaded: loaded,
        refresh: () => setRefresh((prev) => !prev),
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

  return useAsync(fn, refresh);
};
