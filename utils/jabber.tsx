import { useWallet } from "./wallet";
import { useConnection } from "./connection";
import { Thread, Message, Profile, GroupThread } from "./web3/jabber";
import { useRef, useState, useEffect, useCallback } from "react";
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
  retrieveUserGroups,
  retrieveGroupMembers,
} from "@bonfida/jabber";
import { generateDiffieHelllman } from "./diffie-hellman";
import { Buffer } from "buffer";
import axios from "axios";
import { useAsync, range } from "./utils.native";
import { asyncCache, CachePrefix } from "./cache";
import { URL_HASH } from "./ipfs";
import lz from "lz-string";

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
      const threads = await retrieveUserThread(connection, wallet?.publicKey);
      const ids = threads.map((t) => t?.pubkey?.toBase58());

      const filtered = threads.filter(
        ({ pubkey }, index) => !ids.includes(pubkey?.toBase58(), index + 1)
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
  index: number;
  receiver: PublicKey;
  sender: PublicKey;
}

export const useMessageDataWs = (
  sender: string | null | undefined,
  receiver: string | null | undefined,
  refresh?: boolean
) => {
  const [messages, setMessages] = useState<(IMessage | undefined)[]>([]);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);
  const lastCountRef = useRef(0);
  const connection = useConnection();
  const idRef = useRef<null | number>(null);
  const senderRef = useRef(sender);
  const receiverRef = useRef(receiver);
  const refreshRef = useRef(refresh);

  // Websocket callback
  const callback = async (accountInfo: AccountInfo<Buffer>) => {
    if (!sender || !receiver) return;
    const senderAddress = new PublicKey(sender);
    const receiverAddress = new PublicKey(receiver);
    const thread = Thread.deserialize(accountInfo.data);
    const indexes = range(lastCountRef.current, thread.msgCount, 100);
    const _messages = await Message.retrieveFromIndexes(
      connection,
      indexes,
      senderAddress,
      receiverAddress
    );
    setMessages((prev) => [...prev, ..._messages.filter((e) => !!e)]);
    lastCountRef.current = thread.msgCount;
    const threadKey = (
      await Thread.getKeys(senderAddress, receiverAddress)
    )?.toBase58();
    await asyncCache.set(CachePrefix.LastMsgCount + threadKey, thread.msgCount);
  };

  useEffect(() => {
    if (
      senderRef.current !== sender ||
      receiverRef.current !== receiver ||
      refreshRef.current !== refresh
    ) {
      setMessages([]);
      senderRef.current = sender;
      receiverRef.current = receiver;
      loadedRef.current = false;
      mountedRef.current = true;
      refreshRef.current = refresh;
    }
    if (loadedRef.current || !mountedRef.current) {
      return;
    }
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
        receiverAddress
        // Platform.OS === "web" ? 10 : 10
      );
      if (!mountedRef.current) return null;
      setMessages(_messages.filter((e) => !!e));
      loadedRef.current = true;
    };
    load();

    // Subscribe to websocket
    Thread.getKeys(senderAddress, receiverAddress)?.then((key) => {
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
  }, [sender, receiver, refresh]);

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
  typeRef: React.MutableRefObject<string | null>,
  encrypted: boolean
) => {
  if (!wallet) return undefined;

  const hash = Buffer.from(msg).toString();

  const url = URL_HASH + hash;
  try {
    const { data }: { data: Object } = await axios.get(url); // eslint-disable-line

    if (!data) return;

    const dataBuffer = Uint8Array.from(Object.values(data));

    const decrypted = encrypted
      ? (decrytMessageFromBuffer(
          dataBuffer,
          msgAddress,
          wallet,
          sender,
          true
        ) as Buffer)
      : Buffer.from(dataBuffer);

    const len = decrypted[0];
    const type = decrypted.slice(1, 1 + len).toString();
    const file = decodeURI(decrypted.slice(len + 1).toString("base64"));

    await asyncCache.set(CachePrefix.DecryptedMedia + msgAddress.toBase58(), {
      media: lz.compress(file),
      type: type,
    });
    mediaRef.current = file;
    typeRef.current = type;
  } catch (err) {
    console.log(err);
  }
};

export const useLoadMedia = (
  message: IMessage,
  encrypted: boolean
): [string | null, string | null] => {
  const { wallet } = useWallet();
  const mediaRef = useRef<string | null>(null);
  const typeRef = useRef<string | null>(null);

  const fn = async () => {
    const cached = await asyncCache.get<{ media: string; type: string }>(
      CachePrefix.DecryptedMedia + message.address.toBase58()
    );
    if (cached) {
      mediaRef.current = lz.decompress(cached.media);
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
      encrypted
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
  const addressRef = useRef(address);

  // Websocket callback
  const callback = useCallback(
    (accountInfo: AccountInfo<Buffer>) => {
      const _profile = Profile.deserialize(accountInfo.data);
      setProfile(_profile);
    },
    [address?.toBase58()]
  );

  useEffect(() => {
    if (addressRef.current?.toBase58() !== address?.toBase58()) {
      loadedRef.current = false;
      mountedRef.current = true;
      addressRef.current = address;
      setProfile(null);
    }

    if (!address) return;
    if (loadedRef.current || !mountedRef.current) return;

    // Retrieve initial data
    const load = async () => {
      try {
        const _profile = await Profile.retrieve(connection, address);
        if (!mountedRef.current) return null;
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
        idRef.current = null;
      }
    };
  }, [address?.toBase58()]);

  return profile;
};

export const useContactFees = (contact: string) => {
  const [fee, setFee] = useState(0);
  const profile = useProfileWs(new PublicKey(contact));
  const mountedRef = useRef(true);
  const contactRef = useRef(contact);

  useEffect(() => {
    if (contactRef.current !== contact) {
      mountedRef.current = true;
      contactRef.current = contact;
      setFee(0);
    }

    if (!profile || !mountedRef.current) {
      return setFee(0);
    }

    const lamports = profile.lamportsPerMessage.toNumber();
    if (!lamports) return;
    setFee(lamports / LAMPORTS_PER_SOL);

    return () => {
      mountedRef.current = false;
    };
  }, [contact, profile?.name]);

  return fee;
};

export const useProfilePic = (profileOwner: PublicKey) => {
  const profile = useProfileWs(profileOwner);
  const [pic, setPic] = useState<null | string>(null);
  const mountedRef = useRef(true);
  const profileOwnerRef = useRef(profileOwner);
  const loadedRef = useRef(false);

  useEffect(() => {
    const fn = async () => {
      if (loadedRef.current) return;
      if (!profileOwnerRef.current.equals(profileOwner)) {
        mountedRef.current = true;
        profileOwnerRef.current = profileOwner;
        loadedRef.current = false;
      }

      if (!pic && !loadedRef.current && !mountedRef.current) {
        mountedRef.current = true;
      }

      if (!profile || !mountedRef.current) {
        return;
      }
      const cachedKey = CachePrefix.ProfilePicture + profileOwner?.toBase58();
      const cached = await asyncCache.get<string>(cachedKey);
      if (cached) {
        if (!mountedRef.current) return null;
        loadedRef.current = true;
        return setPic(cached);
      }

      if (!profile.name || profile.name === "") return;
      try {
        //  prettier-ignore
        const { data }: { data: Object } = await axios.get( // eslint-disable-line
        URL_HASH + profile.name
      );

        const dataBuffer = Buffer.from(Object.values(data));
        const len = dataBuffer[0];
        const type = dataBuffer.slice(1, 1 + len).toString();
        const _pic = decodeURIComponent(
          dataBuffer.slice(1 + len).toString("base64")
        );
        const base64Data = `data:${type};base64,${_pic}`;
        await asyncCache.set(cachedKey, base64Data);
        if (!mountedRef.current) return null;
        setPic(base64Data);
        loadedRef.current = true;
      } catch (err) {
        console.log(err);
      }
    };
    fn();
    return () => {
      mountedRef.current = false;
    };
  }, [profileOwner.toBase58(), profile?.name]);

  return pic;
};

export const useUserGroup = (
  user: PublicKey | undefined | null,
  refresh: boolean
) => {
  const connection = useConnection();

  const fn = async () => {
    if (!user) return;
    const results = await retrieveUserGroups(connection, user);
    const groupKeys = results.map(
      (gi) => new PublicKey(gi.account.data.slice(1, 32 + 1))
    );
    const groupInfos = await connection.getMultipleAccountsInfo(groupKeys);
    const groups: { groupData: GroupThread; address: PublicKey }[] = groupInfos
      .map((info, idx) => {
        return info?.data
          ? {
              groupData: GroupThread.deserialize(info?.data),
              address: groupKeys[idx],
            }
          : undefined;
      })
      .filter((e) => !!e) as { groupData: GroupThread; address: PublicKey }[];
    return groups;
  };
  return useAsync(fn, !!user != refresh);
};

export const useGroupData = (
  groupKey: string | undefined | null,
  refresh?: boolean
) => {
  const connection = useConnection();
  const [group, setGroup] = useState<GroupThread | null>(null);
  const idRef = useRef<number | null>(null);

  // Websocket callback
  const callback = useCallback(
    async (accountInfo: AccountInfo<Buffer>) => {
      const deserialized: GroupThread = GroupThread.deserialize(
        accountInfo.data
      );
      setGroup(deserialized);
    },
    [groupKey]
  );

  useEffect(() => {
    let mounted = true;
    if (!groupKey) return;
    const load = async () => {
      const _group = await GroupThread.retrieveFromKey(
        connection,
        new PublicKey(groupKey)
      );
      if (!mounted) return;
      setGroup(_group);
    };

    // Load first time
    load();

    // Subscribe to websocket
    const id = connection.onAccountChange(new PublicKey(groupKey), callback);
    idRef.current = id;

    // Unsubscribe and useEffect cleanup
    return () => {
      mounted = false;
      if (idRef.current !== null) {
        connection
          .removeAccountChangeListener(idRef.current)
          .then(() => console.log("Unsubscribe"));
      }
    };
  }, [groupKey, refresh]);
  return group;
};

export const useGroupMessage = (
  groupData: GroupThread | null | undefined,
  groupKey: string | undefined | null,
  refresh?: boolean
) => {
  const connection = useConnection();
  const [messages, setMessages] = useState<(IMessage | undefined)[]>([]);
  const lastCountRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const fn = async () => {
      if (!groupData || !mounted || !groupKey) return;
      const indexes = range(lastCountRef.current, groupData.msgCount, 100);
      const _messages = await Message.retrieveFromIndexes(
        connection,
        indexes,
        new PublicKey(groupKey),
        new PublicKey(groupKey)
      );
      if (!mounted) return;
      setMessages((prev) => [...prev, ..._messages.filter((e) => !!e)]);
      lastCountRef.current = groupData.msgCount;
      await asyncCache.set(
        CachePrefix.LastMsgCount + groupKey,
        groupData.msgCount
      );
    };

    fn();

    return () => {
      mounted = false;
    };
  }, [groupData?.msgCount, groupKey, refresh]);

  return messages;
};

export const useGroupName = (groupKey: string) => {
  const groupData = useGroupData(groupKey);
  return groupData?.groupName;
};

interface IData {
  type: string;
  media: string;
}

// For non encrypted data uploaded on IPFS
export const useGetIpfsData = (hash: string | undefined) => {
  const [data, setData] = useState<null | IData>(null);

  useEffect(() => {
    let mounted = true;
    const fn = async () => {
      if (!hash || !mounted) return;

      const cached = await asyncCache.get<IData>(CachePrefix.IpfsHash + hash);
      if (cached && mounted) {
        return setData({
          type: cached.type,
          media: lz.decompress(cached.media),
        });
      }

      try {
        const url = URL_HASH + hash;
        const { data }: { data: Object } = await axios.get(url); // eslint-disable-line

        if (!data) return;

        const dataBuffer = Buffer.from(Object.values(data));

        const len = dataBuffer[0];
        const type = dataBuffer.slice(1, 1 + len).toString();
        const file = decodeURI(dataBuffer.slice(len + 1).toString("base64"));

        await asyncCache.set(CachePrefix.IpfsHash + hash, {
          media: lz.compress(file),
          type: type,
        });
        if (!mounted) return;
        setData({ type, media: file });
      } catch (err) {
        console.log(err);
      }
    };

    fn();

    return () => {
      mounted = false;
    };
  }, [hash]);

  return data;
};

export const useGroupMembers = (
  groupKey: string | undefined | null,
  groupData: GroupThread | null
) => {
  const connection = useConnection();
  const fn = async () => {
    if (!groupKey) return;
    const result = (
      await retrieveGroupMembers(connection, new PublicKey(groupKey))
    ).map((e) => {
      return {
        address: new PublicKey(e).toBase58(),
        isAdmin: !!groupData?.admins.find((a) => a.equals(new PublicKey(e))),
      };
    });
    return result;
  };

  return useAsync(fn, !groupKey != !groupData);
};
