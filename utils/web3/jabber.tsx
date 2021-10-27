import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js";
import { Schema, deserializeUnchecked, deserialize } from "borsh";
import {
  JABBER_ID,
  SendMessage,
  SetUserProfile,
  CreateThread,
} from "@bonfida/jabber";
import { orderKeys } from "@bonfida/jabber";
import { findProgramAddress } from "./program-address";

export const createThread = async (
  sender: PublicKey,
  receiver: PublicKey,
  feePayer: PublicKey
) => {
  const [thread] = findProgramAddress(
    Thread.generateSeeds(sender, receiver),
    JABBER_ID
  );

  const instruction = new CreateThread({
    sender: sender.toBuffer(),
    receiver: receiver.toBuffer(),
  }).getInstruction(thread, feePayer);

  return instruction;
};

export const sendMessage = async (
  connection: Connection,
  sender: PublicKey,
  receiver: PublicKey,
  message: Uint8Array,
  kind: MessageType
) => {
  const [receiverProfile] = findProgramAddress(
    Profile.generateSeeds(receiver),
    JABBER_ID
  );
  const [threadAccount] = findProgramAddress(
    Thread.generateSeeds(sender, receiver),
    JABBER_ID
  );

  const thread = await Thread.retrieve(connection, sender, receiver);

  const [messageAccount] = findProgramAddress(
    Message.generateSeeds(thread.msgCount, sender, receiver),
    JABBER_ID
  );

  const instruction = new SendMessage({
    kind: kind,
    message: message,
  }).getInstruction(
    sender,
    receiver,
    threadAccount,
    receiverProfile,
    messageAccount
  );

  return instruction;
};

export const setUserProfile = async (
  profileOwner: PublicKey,
  name: string,
  bio: string,
  lamportsPerMessage: number
) => {
  const [profile] = findProgramAddress(
    Profile.generateSeeds(profileOwner),
    JABBER_ID
  );

  const instruction = new SetUserProfile({
    name: name,
    bio: bio,
    lamportsPerMessage: new BN(lamportsPerMessage),
  }).getInstruction(profileOwner, profile);

  return instruction;
};

export enum Tag {
  Uninitialized = 0,
  Profile = 1,
  Thread = 2,
  Message = 3,
  Jabber = 4,
}

export enum MessageType {
  Encrypted = 0,
  Unencrypted = 1,
  EncryptedImage = 2,
  UnencryptedImage = 3,
}

export class Profile {
  tag: Tag;
  name: string;
  bio: string;
  lamportsPerMessage: BN;
  bump: number;

  static schema: Schema = new Map([
    [
      Profile,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["name", "string"],
          ["bio", "string"],
          ["lamportsPerMessage", "u64"],
          ["bump", "u8"],
        ],
      },
    ],
  ]);

  constructor(obj: {
    name: string;
    bio: string;
    lamportsPerMessage: BN;
    bump: number;
  }) {
    this.tag = Tag.Profile;
    this.name = obj.name;
    this.bio = obj.bio;
    this.lamportsPerMessage = obj.lamportsPerMessage;
    this.bump = obj.bump;
  }

  static deserialize(data: Buffer) {
    return deserializeUnchecked(this.schema, Profile, data);
  }

  static async retrieve(connection: Connection, owner: PublicKey) {
    const [profile] = findProgramAddress(
      Profile.generateSeeds(owner),
      JABBER_ID
    );

    const accountInfo = await connection.getAccountInfo(profile);

    if (!accountInfo?.data) {
      throw new Error("No profile found");
    }

    return this.deserialize(accountInfo?.data);
  }

  static generateSeeds(profileOwner: PublicKey) {
    return [Buffer.from("profile"), profileOwner.toBuffer()];
  }
}

export class Thread {
  tag: Tag;
  msgCount: number;
  user1: PublicKey;
  user2: PublicKey;
  bump: number;

  static schema: Schema = new Map([
    [
      Thread,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["msgCount", "u32"],
          ["user1", [32]],
          ["user2", [32]],
          ["bump", "u8"],
        ],
      },
    ],
  ]);

  constructor(obj: {
    msgCount: number;
    user1: Uint8Array;
    user2: Uint8Array;
    bump: number;
  }) {
    this.tag = Tag.Thread;
    this.msgCount = obj.msgCount;
    this.user1 = new PublicKey(obj.user1);
    this.user2 = new PublicKey(obj.user2);
    this.bump = obj.bump;
  }

  static deserialize(data: Buffer) {
    return deserialize(this.schema, Thread, data);
  }

  static generateSeeds(sender: PublicKey, receiver: PublicKey) {
    const [key1, key2] = orderKeys(sender, receiver);
    return [Buffer.from("thread"), key1.toBuffer(), key2.toBuffer()];
  }

  static getKeys(sender: PublicKey, receiver: PublicKey) {
    const [thread] = findProgramAddress(
      Thread.generateSeeds(sender, receiver),
      JABBER_ID
    );
    return thread;
  }

  static async retrieve(
    connection: Connection,
    sender: PublicKey,
    receiver: PublicKey
  ) {
    const [thread] = findProgramAddress(
      Thread.generateSeeds(sender, receiver),
      JABBER_ID
    );
    const accountInfo = await connection.getAccountInfo(thread);

    if (!accountInfo?.data) {
      throw new Error("Thread not found");
    }

    return this.deserialize(accountInfo.data);
  }

  static async retrieveFromKey(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);

    if (!accountInfo?.data) {
      throw new Error("Thread not found");
    }

    return this.deserialize(accountInfo.data);
  }
}

export class Message {
  tag: Tag;
  kind: MessageType;
  timestamp: BN;
  msg: Uint8Array;
  sender: PublicKey;

  static schema: Schema = new Map([
    [
      Message,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["kind", "u8"],
          ["timestamp", "u64"],
          ["msg", ["u8"]],
          ["sender", [32]],
        ],
      },
    ],
  ]);

  constructor(obj: {
    kind: MessageType;
    timestamp: BN;
    msg: Uint8Array;
    sender: Uint8Array;
  }) {
    this.tag = Tag.Message;
    this.kind = obj.kind;
    this.timestamp = obj.timestamp;
    this.msg = obj.msg;
    this.sender = new PublicKey(obj.sender);
  }

  static deserialize(data: Buffer) {
    return deserializeUnchecked(this.schema, Message, data);
  }

  static generateSeeds(
    messageCount: number,
    sender: PublicKey,
    receiver: PublicKey
  ) {
    const [key1, key2] = orderKeys(sender, receiver);
    return [
      Buffer.from("message"),
      Buffer.from(messageCount.toString()),
      key1.toBuffer(),
      key2.toBuffer(),
    ];
  }

  static async retrieveFromIndex(
    connection: Connection,
    index: number,
    receiver: PublicKey,
    sender: PublicKey
  ) {
    const [messageAccount] = findProgramAddress(
      this.generateSeeds(index, sender, receiver),
      JABBER_ID
    );
    const accountInfo = await connection.getAccountInfo(messageAccount);
    if (!accountInfo?.data) {
      throw new Error("Invalid message info");
    }
    return this.deserialize(accountInfo.data);
  }

  static async retrieveFromThread(
    connection: Connection,
    sender: PublicKey,
    receiver: PublicKey,
    limit?: number
  ) {
    const thread = await Thread.retrieve(connection, sender, receiver);
    let messageAccounts: PublicKey[] = [];
    const start = limit ? limit : thread.msgCount;
    for (let i = thread.msgCount - start; i < thread.msgCount; i++) {
      const [acc] = findProgramAddress(
        this.generateSeeds(i, sender, receiver),
        JABBER_ID
      );
      messageAccounts.push(acc);
    }
    const accountInfos = await connection.getMultipleAccountsInfo(
      messageAccounts
    );
    return accountInfos.map((info, i) =>
      info?.data
        ? deserializeMessage(info?.data, messageAccounts[i])
        : undefined
    );
  }
}

const deserializeMessage = (data: Buffer, address: PublicKey) => {
  const result = {
    message: Message.deserialize(data),
    address: address,
  };
  return result;
};
