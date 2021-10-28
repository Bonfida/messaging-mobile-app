import {
  PublicKey,
  Connection,
  TransactionInstruction,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import { useState, useEffect, useRef, useCallback } from "react";

export const validateInput = (input: string) => {
  if (input.includes(".sol")) {
    return {
      valid: true,
      input: input.split(".sol")[0],
      twitter: false,
      domain: true,
    };
  }
  if (input.includes("@")) {
    return {
      valid: true,
      input: input.split("@")[1],
      twitter: true,
      domain: false,
    };
  }
  return { valid: false, input: undefined, twitter: false, domain: false };
};

export function abbreviateAddress(
  address: PublicKey | undefined | string | null,
  size = 4
) {
  if (!address) {
    return null;
  }
  const base58 = typeof address === "string" ? address : address.toBase58();
  return base58?.slice(0, size) + "…" + base58?.slice(-size);
}

export const signAndSendTransactionInstructions = async (
  // sign and send transaction
  connection: Connection,
  signers: Array<Keypair>,
  feePayer: Keypair,
  txInstructions: Array<TransactionInstruction>
): Promise<string> => {
  const tx = new Transaction();
  tx.feePayer = feePayer.publicKey;
  signers.push(feePayer);
  tx.add(...txInstructions);
  return await connection.sendTransaction(tx, signers, {
    skipPreflight: false,
  });
};

export function roundToDecimal(
  value: number | null | undefined,
  decimals: number | undefined | null
) {
  if (value === null || value === undefined) {
    return null;
  }
  return decimals ? Math.round(value * 10 ** decimals) / 10 ** decimals : value;
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useAsync<T>(
  asyncFn: () => Promise<T>,
  refresh: boolean,
  interval?: number
): [T | undefined, boolean] {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(false);
  const mountedRef = useRef(true);
  const refreshRef = useRef(new Boolean(refresh));

  const execute = useCallback(() => {
    setLoading(true);
    return asyncFn()
      .then((res) => {
        if (!mountedRef.current) return null;
        setValue(res);
        return res;
      })
      .catch(() => {
        if (!mountedRef.current) return null;
        setValue(undefined);
      })
      .finally(() => {
        if (!mountedRef.current) return null;
        setLoading(false);
      });
  }, [asyncFn]);

  useEffect(() => {
    if (!interval) return;
    const timer = setInterval(() => {
      mountedRef.current = true;
      setCounter((prev) => !prev);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Hard refresh
    if (mountedRef.current === false && refreshRef.current !== refresh) {
      mountedRef.current = true;
    }
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh, counter]);

  return [value, loading];
}

export const range = (start: number, end: number) => {
  return Array.from(new Array(end - start), (x, i) => start + i);
};
