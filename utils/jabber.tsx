import { useWallet } from "./wallet";
import { useConnection } from "./connection";
import { Thread, Message, Profile } from "./web3/jabber";
import { useMemo, useRef } from "react";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  retrieveUserThread,
  decryptMessage,
  encryptMessage,
} from "@bonfida/jabber";
import { generateDiffieHelllman } from "./diffie-hellman";
import { Buffer } from "buffer";
import axios from "axios";
import { useAsync, setCache, getCache } from "./utils";
import { CachePrefix, useCache } from "./cache";
import { cache } from "./ipfs";
import { useState } from "react-transition-group/node_modules/@types/react";

export enum MediaType {
  Image,
  Video,
  Audio,
}

export const findType = (type: string | null) => {
  if (!type) {
    return null;
  }
  if (type.includes("image")) {
    return MediaType.Image;
  }
  if (type.includes("video")) {
    return MediaType.Video;
  }
  if (type.includes("audio")) {
    return MediaType.Audio;
  }
  return null;
};

export const useUserThread = (refresh: boolean) => {
  const { wallet } = useWallet();
  const connection = useConnection();

  const fn = async () => {
    try {
      if (!wallet || !connection) return;
      const threads = await retrieveUserThread(connection, wallet.publicKey);
      const ids = threads.map((t) => t.pubkey.toBase58());

      const filtered = threads.filter(
        ({ pubkey }, index) => !ids.includes(pubkey.toBase58(), index + 1)
      );

      const result = filtered
        .map((t) => {
          try {
            return Thread.deserialize(t.account.data);
          } catch {
            return undefined;
          }
        })
        .filter((e) => !!e && e.msgCount > 0);
      return result.sort((a, b) => {
        if (!!a && !!b) {
          return b?.msgCount - a?.msgCount;
        }
        return 1;
      });
    } catch (err) {
      console.log(err);
      return undefined;
    }
  };

  return useAsync(fn, refresh || !!wallet);
};

export interface IMessage {
  message: Message;
  address: PublicKey;
}

export const useMessageData = (
  sender: string | null | undefined,
  receiver: string | null | undefined,
  refresh: boolean
) => {
  const connection = useConnection();

  const fn = async () => {
    if (!sender || !receiver) return;
    try {
      return await Message.retrieveFromThread(
        connection,
        new PublicKey(sender),
        new PublicKey(receiver)
      );
    } catch (err) {
      console.log("useMessage", err);
    }
  };

  return useAsync(fn, refresh, 1_000);
};

export const decrytMessageFromBuffer = (
  msg: Uint8Array,
  msgAddress: PublicKey,
  wallet: Keypair | undefined,
  sender: PublicKey,
  asBuffer?: boolean
) => {
  if (!wallet) {
    return undefined;
  }

  const dhKeys = generateDiffieHelllman(
    wallet.publicKey.toBuffer(),
    wallet.secretKey
  );
  const decryptedBuffer = decryptMessage(
    Buffer.from(msg),
    dhKeys,
    sender,
    new Uint8Array(msgAddress.toBuffer().slice(0, 24))
  );

  if (!decryptedBuffer) return undefined;

  if (asBuffer) {
    return Buffer.from(decryptedBuffer);
  }

  return Buffer.from(decryptedBuffer).toString();
};

export const encryptMessageToBuffer = (
  message: string,
  wallet: Keypair,
  receiver: PublicKey,
  msgAddress: PublicKey
) => {
  const buffer = new Uint8Array(Buffer.from(message));

  const dhKeys = generateDiffieHelllman(
    wallet.publicKey.toBuffer(),
    wallet.secretKey
  );

  const encrypted = encryptMessage(
    buffer,
    dhKeys,
    receiver,
    new Uint8Array(msgAddress.toBuffer().slice(0, 24))
  );

  return encrypted;
};

// [media, type]
export const decryptedCache = new Map<string, [string, string]>();

export const decryptMediaFromBuffer = async (
  msg: Uint8Array,
  msgAddress: PublicKey,
  wallet: Keypair | undefined,
  sender: PublicKey,
  mediaRef: React.MutableRefObject<string | null>,
  typeRef: React.MutableRefObject<string | null>,
  cache: React.MutableRefObject<{} | null>
) => {
  if (!wallet) return undefined;

  const prefix64 = "data:application/octet-stream;base64,";
  const hash = Buffer.from(msg).toString();
  const url = `https://ipfs.infura.io/ipfs/${hash}`;

  const { data }: { data: Blob } = await axios.get(url, {
    responseType: "blob",
  });

  let buffer: Buffer;
  const fileReaderInstance = new FileReader();

  fileReaderInstance.onload = () => {
    let result = fileReaderInstance.result as string;
    result = result.split(prefix64)[1];
    buffer = Buffer.from(result, "base64");
    const decrypted = decrytMessageFromBuffer(
      new Uint8Array(buffer),
      msgAddress,
      wallet,
      sender,
      true
    );

    if (!decrypted || typeof decrypted === "string") return undefined;

    const len = decrypted[0];
    const type = decrypted.slice(1, 1 + len).toString();
    const file = decrypted.slice(len + 1).toString("base64");
    // @ts-ignore
    cache.current[CachePrefix.DecryptedMedia + msgAddress.toBase58()] = {
      media: file,
      type: type,
    };
    mediaRef.current = file;
    typeRef.current = type;
  };

  fileReaderInstance.readAsDataURL(data);
};

export const useLoadMedia = (
  message: IMessage
): [string | null, string | null] => {
  const { wallet } = useWallet();
  const mediaRef = useRef<string | null>(null);
  const typeRef = useRef<string | null>(null);
  const { cache, getCache } = useCache();

  const fn = async () => {
    const cached = getCache(
      CachePrefix.DecryptedMedia + message.address.toBase58()
    );
    if (!!cached) {
      mediaRef.current = cached.media;
      typeRef.current = cached.type;
      return;
    }
    await decryptMediaFromBuffer(
      message.message.msg,
      message.address,
      wallet,
      message.message.sender,
      mediaRef,
      typeRef,
      cache
    );
  };

  useAsync(fn, false, 10 * 60 * 1_000);

  return [mediaRef.current, typeRef.current];
};

export const useProfile = (refresh: boolean) => {
  const connection = useConnection();
  const { wallet } = useWallet();

  const fn = async () => {
    if (!wallet?.publicKey) return;
    return await Profile.retrieve(connection, wallet.publicKey);
  };

  return useAsync(fn, refresh);
};

export const useContactFees = (contact: string) => {
  const connection = useConnection();
  const fn = async () => {
    const contactProfile = await Profile.retrieve(
      connection,
      new PublicKey(contact)
    );
    const lamports = contactProfile.lamportsPerMessage.toNumber();
    if (!lamports) {
      return 0;
    }
    return contactProfile.lamportsPerMessage.toNumber() / LAMPORTS_PER_SOL;
  };
  return useAsync(fn, false);
};
