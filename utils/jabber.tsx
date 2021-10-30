import { useWallet } from "./wallet";
import { useConnection } from "./connection";
import { Thread, Message, Profile } from "./web3/jabber";
import { useRef, useState, useEffect } from "react";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  AccountInfo,
} from "@solana/web3.js";
import {
  retrieveUserThread,
  decryptMessage,
  encryptMessage,
} from "@bonfida/jabber";
import { generateDiffieHelllman } from "./diffie-hellman";
import { Buffer } from "buffer";
import axios from "axios";
import { useAsync, range } from "./utils";
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

export const useMessageDataWs = (
  sender: string | null | undefined,
  receiver: string | null | undefined
) => {
  const [messages, setMessages] = useState<(IMessage | undefined)[]>([]);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);
  const lastCountRef = useRef(0);
  const connection = useConnection();
  const idRef = useRef<null | number>(null);

  // Websocket callback
  const callback = async (accountInfo: AccountInfo<Buffer>) => {
    if (!sender || !receiver) return;
    const senderAddress = new PublicKey(sender);
    const receiverAddress = new PublicKey(receiver);
    const thread = Thread.deserialize(accountInfo.data);
    const indexes = range(lastCountRef.current, thread.msgCount);
    const _messages = await Message.retrieveFromIndexes(
      connection,
      indexes,
      senderAddress,
      receiverAddress
    );
    setMessages((prev) => [...prev, ..._messages]);
    lastCountRef.current = thread.msgCount;
    const threadKey = (
      await Thread.getKeys(senderAddress, receiverAddress)
    )?.toBase58();
    await asyncCache.set(CachePrefix.LastMsgCount + threadKey, thread.msgCount);
  };

  useEffect(() => {
    if (loadedRef.current || !mountedRef.current) return;
    if (!sender || !receiver) return;
    const senderAddress = new PublicKey(sender);
    const receiverAddress = new PublicKey(receiver);

    // Retrieve initial thread data
    const load = async () => {
      const thread = await Thread.retrieve(
        connection,
        senderAddress,
        receiverAddress
      );
      // Update last thread count
      lastCountRef.current = thread.msgCount;
      const threadKey = (
        await Thread.getKeys(senderAddress, receiverAddress)
      )?.toBase58();
      await asyncCache.set(
        CachePrefix.LastMsgCount + threadKey,
        thread.msgCount
      );
      // Retrieve initial data
      const _messages = await Message.retrieveFromThread(
        connection,
        senderAddress,
        receiverAddress,
        10
      );
      setMessages(_messages);
      loadedRef.current = true;
    };
    load();

    // Subscribe to websocket
    Thread.getKeys(senderAddress, receiverAddress).then((key) => {
      if (key) {
        const id = connection.onAccountChange(key, callback);
        idRef.current = id;
      }
    });

    // Unsubscribe and useEffect cleanup
    return () => {
      mountedRef.current = false;
      if (idRef.current !== null) {
        connection
          .removeAccountChangeListener(idRef.current)
          .then(() => console.log("Unsubscribe"));
      }
    };
  }, []);

  return messages;
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

  const { data }: { data: Object } = await axios.get(url); // eslint-disable-line

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
    if (cached) {
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

  useAsync(fn, false);

  return [mediaRef.current, typeRef.current];
};

export const useProfileWs = (address: PublicKey | undefined) => {
  const connection = useConnection();
  const [profile, setProfile] = useState<null | Profile>(null);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);
  const idRef = useRef<null | number>(null);

  // Websocket callback
  const callback = (accountInfo: AccountInfo<Buffer>) => {
    const _profile = Profile.deserialize(accountInfo.data);
    setProfile(_profile);
  };

  useEffect(() => {
    if (!address) return;
    if (loadedRef.current || !mountedRef.current) return;

    // Retrieve initial data
    const load = async () => {
      try {
        const _profile = await Profile.retrieve(connection, address);
        setProfile(_profile);
        loadedRef.current = true;
      } catch (err) {
        console.log(err);
      }
    };
    load();

    // Subscribe to websocket
    Profile.getKey(address).then((key) => {
      const id = connection.onAccountChange(key, callback);
      idRef.current = id;
    });

    // Unsubscribe and useEffect cleanup
    return () => {
      mountedRef.current = false;
      if (idRef.current !== null) {
        connection
          .removeAccountChangeListener(idRef.current)
          .then(() => console.log("Unsubscribe"));
      }
    };
  }, []);
  return profile;
};

export const useContactFees = (contact: string) => {
  const [fee, setFee] = useState(0);
  const profile = useProfileWs(new PublicKey(contact));
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!profile || !mountedRef) return;
    const lamports = profile.lamportsPerMessage.toNumber();
    if (!lamports) return;
    setFee(lamports / LAMPORTS_PER_SOL);

    return () => {
      mountedRef.current = false;
    };
  }, [profile]);

  return fee;
};

export const useProfilePic = (profileOwner: PublicKey) => {
  const profile = useProfileWs(profileOwner);
  const [pic, setPic] = useState<null | string>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const fn = async () => {
      if (!profile || !mountedRef) return;
      const cachedKey = CachePrefix.ProfilePicture + profileOwner?.toBase58();
      const cached = await asyncCache.get(cachedKey);
      if (cached) {
        return setPic(cached);
      }
      if (!profile.name || profile.name === "") return;
      //  prettier-ignore
      const { data }: { data: Object } = await axios.get( // eslint-disable-line
        URL_HASH + profile.name
      );

      const dataBuffer = Buffer.from(Object.values(data));
      const len = dataBuffer[0];
      const type = dataBuffer.slice(1, 1 + len).toString();
      const pic = decodeURIComponent(
        dataBuffer.slice(1 + len).toString("base64")
      );
      const base64Data = `data:${type};base64,${pic}`;
      setPic(base64Data);
      await asyncCache.set(cachedKey, base64Data);
    };
    fn();
    return () => {
      mountedRef.current = false;
    };
  }, [profile]);

  return pic;
};
