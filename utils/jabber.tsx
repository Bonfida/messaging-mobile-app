import { useWallet } from "./wallet";
import { useConnection } from "./connection";
import { Thread, Message, Profile } from "./web3/jabber";
import { useRef } from "react";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  retrieveUserThread,
  decryptMessage,
  encryptMessage,
} from "@bonfida/jabber";
import { generateDiffieHelllman } from "./diffie-hellman";
import { Buffer } from "buffer";
import axios from "axios";
import { useAsync } from "./utils";
import { asyncCache, CachePrefix } from "./cache";
import { URL_HASH } from "./ipfs";

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

  return useAsync(fn, refresh != !!wallet);
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
      const senderAddress = new PublicKey(sender);
      const receiverAddress = new PublicKey(receiver);

      const thread = await Thread.retrieve(
        connection,
        senderAddress,
        receiverAddress
      );

      await asyncCache.set(
        CachePrefix.LastMsgCount +
          Thread.getKeys(senderAddress, receiverAddress).toBase58(),
        thread.msgCount
      );

      const messages = await Message.retrieveFromThread(
        connection,
        senderAddress,
        receiverAddress,
        10
      );

      return messages;
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
  message: string | Buffer,
  wallet: Keypair,
  receiver: PublicKey,
  msgAddress: PublicKey
) => {
  let buffer: Uint8Array;
  if (typeof message === "string") {
    buffer = new Uint8Array(Buffer.from(message));
  } else {
    buffer = new Uint8Array(message);
  }

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

export const decryptMediaFromBuffer = async (
  msg: Uint8Array,
  msgAddress: PublicKey,
  wallet: Keypair | undefined,
  sender: PublicKey,
  mediaRef: React.MutableRefObject<string | null>,
  typeRef: React.MutableRefObject<string | null>
) => {
  if (!wallet) return undefined;

  const hash = Buffer.from(msg).toString();

  const url = URL_HASH + hash;

  const { data }: { data: Object } = await axios.get(url);

  if (!data) return;

  const dataBuffer = Uint8Array.from(Object.values(data));
  const decrypted = decrytMessageFromBuffer(
    dataBuffer,
    msgAddress,
    wallet,
    sender,
    true
  ) as Buffer;

  const len = decrypted[0];
  const type = decrypted.slice(1, 1 + len).toString();
  const file = decodeURI(decrypted.slice(len + 1).toString("base64"));

  await asyncCache.set(CachePrefix.DecryptedMedia + msgAddress.toBase58(), {
    media: file,
    type: type,
  });
  mediaRef.current = file;
  typeRef.current = type;
};

export const useLoadMedia = (
  message: IMessage
): [string | null, string | null] => {
  const { wallet } = useWallet();
  const mediaRef = useRef<string | null>(null);
  const typeRef = useRef<string | null>(null);

  const fn = async () => {
    const cached = await asyncCache.get(
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
      typeRef
    );
  };

  useAsync(fn, false, 10 * 60 * 1_000);

  return [mediaRef.current, typeRef.current];
};

export const useProfile = (
  address: PublicKey | undefined,
  refresh: boolean
) => {
  const connection = useConnection();

  const fn = async () => {
    if (!address) return;
    return await Profile.retrieve(connection, address);
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
  return useAsync(fn, false, 10 * 60 * 1_000);
};

export const useProfilePic = (profileOwner: PublicKey) => {
  const connection = useConnection();
  const fn = async () => {
    try {
      if (!profileOwner) return;
      const profile = await Profile.retrieve(connection, profileOwner);
      if (!profile.name) return;
      const { data }: { data: Object } = await axios.get(
        URL_HASH + profile.name
      );

      const dataBuffer = Buffer.from(Object.values(data));
      const len = dataBuffer[0];
      const type = dataBuffer.slice(1, 1 + len).toString();
      const pic = decodeURIComponent(
        dataBuffer.slice(1 + len).toString("base64")
      );
      return `data:${type};base64,${pic}`;
    } catch {}
  };
  return useAsync(fn, false, 10 * 60 * 1_000);
};
