import React from "react";
import {
  PublicKey,
  Connection,
  TransactionInstruction,
  Transaction,
  Keypair,
} from "@solana/web3.js";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardEvent,
} from "react-native";
import { keyBoardRef } from "../types";
import axios from "axios";

export const TWFWrapper = ({ children }: { children: React.ReactNode }) => {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }
  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export const encode = (uri: string) => {
  if (Platform.OS === "android") return encodeURI(`file://${uri}`);
  else return uri;
};

export const validateInput = (input: string) => {
  try {
    new PublicKey(input);
    return { valid: true, input, twitter: false, domain: false, pubkey: true };
  } catch (err) {
    console.log(err);
  }
  if (input.includes(".sol")) {
    return {
      valid: true,
      input: input.split(".sol")[0],
      twitter: false,
      domain: true,
      pubkey: false,
    };
  }
  if (input.includes("@")) {
    return {
      valid: true,
      input: input.split("@")[1],
      twitter: true,
      domain: false,
      pubkey: false,
    };
  }
  return {
    valid: false,
    input: undefined,
    twitter: false,
    domain: false,
    pubkey: false,
  };
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
  refresh: boolean
): [T | undefined, boolean] {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(false);
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
    // Hard refresh
    if (mountedRef.current === false && refreshRef.current !== refresh) {
      mountedRef.current = true;
    }
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  return [value, loading];
}

export const range = (start: number, end: number, max?: number) => {
  if (max && end - start > max) {
    start = end - max;
  }
  return Array.from(new Array(end - start), (x, i) => start + i);
};

export const formatDisplayName = (name: string | undefined) => {
  if (!name?.includes("@") && !name?.includes(".sol")) {
    return abbreviateAddress(name);
  }
  return name;
};

export const useKeyBoardOffset = () => {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const onKeyboardShow = (event: KeyboardEvent) =>
    setKeyboardOffset(event.endCoordinates.height);
  const onKeyboardHide = () => setKeyboardOffset(0);
  const keyboardDidShowListener = useRef(null) as keyBoardRef;
  const keyboardDidHideListener = useRef(null) as keyBoardRef;

  useEffect(() => {
    keyboardDidShowListener.current = Keyboard.addListener(
      "keyboardWillShow",
      onKeyboardShow
    );

    keyboardDidHideListener.current = Keyboard.addListener(
      "keyboardWillHide",
      onKeyboardHide
    );

    return () => {
      keyboardDidShowListener.current?.remove();
      keyboardDidHideListener.current?.remove();
    };
  }, []);

  return keyboardOffset;
};

export const abbreviateBio = (bio: string | undefined | null) => {
  if (!bio) return null;
  const max = 45;
  if (bio.length > max) {
    return bio.slice(0, max) + "...";
  }
  return bio;
};

export const shortUrl = async (longUrl: string) => {
  const response = await axios.get(
    `https://tinyurl.com/api-create.php?url=${longUrl}`
  );
  return response.data;
};
