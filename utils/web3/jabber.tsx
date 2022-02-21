import { PublicKey, Connection } from "@solana/web3.js";
import BN from "bn.js";
import { Schema, deserializeUnchecked, deserialize } from "borsh";
import { orderKeys } from "@bonfida/jabber";
import { findProgramAddress } from "./program-address";
import {
  createProfileInstruction,
  createThreadInstruction,
  setUserProfileInstruction,
  sendMessageInstruction,
  createGroupThreadInstruction,
  editGroupThreadInstruction,
  addAdminToGroupInstruction,
  removeAdminFromGroupInstruction,
  createGroupIndexInstruction,
  sendMessageGroupInstruction,
  deleteMessageInstruction,
  deleteGroupMessageInstruction,
  createSubscriptionInstruction,
} from "@bonfida/jabber";
import { MemcmpFilter, SystemProgram } from "@solana/web3.js";

export const JABBER_ID = new PublicKey(
  "2iKLjPgcL3cwEGwJeXj3bEbYFkWEPQ4UqpueL1iSXZZ9"
);
export const SOL_VAULT = new PublicKey(
  "GcWEQ9K78FV7LEHteFVciYApERk5YvQuFDQPk1yYJVXi"
);

/**
 *
 * @param profileOwner Owner of the profile
 * @param displayDomainName Domain name to display on the profile
 * @param pictureHash The IPFS hash of the profile pic
 * @param bio Bio to display on the profile
 * @param lamportsPerMessage Amount of lamports the user wants to receive (i.e be paid) per message
 * @returns
 */
export const createProfile = async (
  profileOwner: PublicKey,
  displayDomainName: string,
  pictureHash: string,
  bio: string,
  lamportsPerMessage: number
) => {
  const [profile] = await findProgramAddress(
    Profile.generateSeeds(profileOwner),
    JABBER_ID
  );
  const instruction = new createProfileInstruction({
    displayDomainName,
    bio,
    pictureHash,
    lamportsPerMessage: new BN(lamportsPerMessage),
  }).getInstruction(
    JABBER_ID,
    SystemProgram.programId,
    profile,
    profileOwner,
    profileOwner
  );

  return instruction;
};

/**
 *
 * @param sender User 1 of the thread
 * @param receiver User 2 of the thread
 * @param feePayer Fee payer of the instruction
 * @returns
 */
export const createThread = async (
  sender: PublicKey,
  receiver: PublicKey,
  feePayer: PublicKey
) => {
  const [thread] = await findProgramAddress(
    Thread.generateSeeds(sender, receiver),
    JABBER_ID
  );

  const instruction = new createThreadInstruction({
    senderKey: sender.toBuffer(),
    receiverKey: receiver.toBuffer(),
  }).getInstruction(JABBER_ID, SystemProgram.programId, thread, feePayer);

  return instruction;
};

/**
 *
 * @param pictureHash IPFS hash of the profile pic
 * @param displayDomainName Display domain name
 * @param bio User bio
 * @param lamportsPerMessage lamports per message
 * @param allowDm If the user allows DM
 * @param profileOwner Profile owner
 * @returns
 */
export const setUserProfile = async (
  pictureHash: string,
  displayDomainName: string,
  bio: string,
  lamportsPerMessage: number,
  allowDm: boolean,
  profileOwner: PublicKey
) => {
  const [profile] = await findProgramAddress(
    Profile.generateSeeds(profileOwner),
    JABBER_ID
  );

  const instruction = new setUserProfileInstruction({
    pictureHash,
    displayDomainName,
    bio,
    lamportsPerMessage: new BN(lamportsPerMessage),
    allowDm: allowDm ? 1 : 0,
  }).getInstruction(JABBER_ID, profileOwner, profile);

  return instruction;
};

/**
 *
 * @param connection The RPC connection object
 * @param sender The message sender account
 * @param receiver The message receiver account
 * @param message The message
 * @param kind The message kind
 * @param repliesTo If the message is a replie to another message (if not PublicKey.default())
 * @returns
 */
export const sendMessage = async (
  connection: Connection,
  sender: PublicKey,
  receiver: PublicKey,
  message: Uint8Array,
  kind: MessageType,
  repliesTo: PublicKey
) => {
  const [receiverProfile] = await findProgramAddress(
    Profile.generateSeeds(receiver),
    JABBER_ID
  );
  const [threadAccount] = await findProgramAddress(
    Thread.generateSeeds(sender, receiver),
    JABBER_ID
  );

  const thread = await Thread.retrieve(connection, sender, receiver);

  const [messageAccount] = await findProgramAddress(
    Message.generateSeeds(thread.msgCount, sender, receiver),
    JABBER_ID
  );

  const instruction = new sendMessageInstruction({
    kind: kind,
    message: Array.from(message),
    repliesTo: repliesTo.toBuffer(),
  }).getInstruction(
    JABBER_ID,
    SystemProgram.programId,
    sender,
    receiver,
    threadAccount,
    receiverProfile,
    messageAccount,
    SOL_VAULT
  );

  return instruction;
};

/**
 *
 * @param connection The solana connection object to the RPC node
 * @param user The user to fetch threads for
 * @returns
 */
export const retrieveUserThread = async (
  connection: Connection,
  user: PublicKey
) => {
  const filters_1 = [
    {
      memcmp: {
        offset: 1 + 4,
        bytes: user.toBase58(),
      },
    },
  ];
  const filters_2 = [
    {
      memcmp: {
        offset: 1 + 4 + 32,
        bytes: user.toBase58(),
      },
    },
  ];
  const result_1 = await connection.getProgramAccounts(JABBER_ID, {
    filters: filters_1,
  });
  const result_2 = await connection.getProgramAccounts(JABBER_ID, {
    filters: filters_2,
  });
  return result_1.concat(result_2);
};

/**
 *
 * @param groupName Name of the group
 * @param destinationWallet Wallet that will receive the fees
 * @param lamportsPerMessage SOL fee per message
 * @param admins Admins of the group
 * @param owner Owner of the group (only address that will be able to edit the group)
 * @param mediaEnabled Is it possible to send media (images, videos and audios)?
 * @param feePayer Fee payer of the instruction
 * @param visible If the group can be visible for others to join. Only used for the app, at the end of the day everything is visible on-chain
 * @returns
 */
export const createGroupThread = async (
  groupName: string,
  destinationWallet: PublicKey,
  lamportsPerMessage: BN,
  admins: PublicKey[],
  owner: PublicKey,
  mediaEnabled: boolean,
  adminOnly: boolean,
  feePayer: PublicKey,
  visible: boolean
) => {
  const groupThread = await GroupThread.getKey(groupName, owner);

  const instruction = new createGroupThreadInstruction({
    groupName,
    destinationWallet: destinationWallet.toBuffer(),
    lamportsPerMessage,
    admins: admins.map((e) => e.toBuffer()),
    owner: owner.toBuffer(),
    mediaEnabled: mediaEnabled ? 1 : 0,
    adminOnly: adminOnly ? 1 : 0,
    visible: visible ? 1 : 0,
  }).getInstruction(JABBER_ID, SystemProgram.programId, groupThread, feePayer);

  return instruction;
};

/**
 *
 * @param groupName Name of the group
 * @param owner Owner of the group
 * @param destinationWallet allet that will receive the fees
 * @param lamportsPerMessage SOL fee per message
 * @param mediaEnabled Is it possible to send media (images, videos and audios)?
 * @returns
 */
export const editGroupThread = async (
  groupName: string,
  owner: PublicKey,
  destinationWallet: PublicKey,
  lamportsPerMessage: BN,
  mediaEnabled: boolean,
  adminOnly: boolean,
  groupPicHash: string,
  visible: boolean
) => {
  const groupThread = await GroupThread.getKey(groupName, owner);

  const instruction = new editGroupThreadInstruction({
    destinationWallet: destinationWallet.toBuffer(),
    lamportsPerMessage,
    owner: owner.toBuffer(),
    mediaEnabled: mediaEnabled ? 1 : 0,
    adminOnly: adminOnly ? 1 : 0,
    groupPicHash,
    visible: visible ? 1 : 0,
  }).getInstruction(JABBER_ID, owner, groupThread);

  return instruction;
};

/**
 *
 * @param groupKey Address of the group thread
 * @param adminToAdd Address of the admin to add
 * @param groupOwner Owner of the group
 * @returns
 */
export const addAdminToGroup = (
  groupKey: PublicKey,
  adminToAdd: PublicKey,
  groupOwner: PublicKey
) => {
  const instruction = new addAdminToGroupInstruction({
    adminAddress: adminToAdd.toBuffer(),
  }).getInstruction(JABBER_ID, groupKey, groupOwner);

  return instruction;
};

/**
 *
 * @param groupKey Address of the group thread
 * @param adminToRemove Address of the admin to remove
 * @param adminIndex Index of the admin in the Vec<Pubkey> of admins (cf GroupThread state)
 * @param groupOwner Owner of the group
 * @returns
 */
export const removeAdminFromGroup = (
  groupKey: PublicKey,
  adminToRemove: PublicKey,
  adminIndex: number,
  groupOwner: PublicKey
) => {
  const instruction = new removeAdminFromGroupInstruction({
    adminAddress: adminToRemove.toBuffer(),
    adminIndex: new BN(adminIndex),
  }).getInstruction(JABBER_ID, groupKey, groupOwner);

  return instruction;
};

export const createGroupIndex = async (
  groupName: string,
  owner: PublicKey,
  groupThread: PublicKey
) => {
  const groupIndex = await GroupThreadIndex.getKey(
    groupName,
    owner,
    groupThread
  );
  const instruction = new createGroupIndexInstruction({
    groupName,
    groupThreadKey: groupThread.toBuffer(),
    owner: owner.toBuffer(),
  }).getInstruction(JABBER_ID, SystemProgram.programId, groupIndex, owner);

  return instruction;
};

/**
 *
 * @param kind Message type
 * @param message Message to send
 * @param groupName Name of the group
 * @param sender User sending the message
 * @param groupThread Key of the group thread
 * @param destinationWallet Destination wallet of the group
 * @param messageAccount Account of the message
 * @param adminIndex Admin index
 */
export const sendMessageGroup = async (
  kind: MessageType,
  message: Uint8Array,
  groupName: string,
  sender: PublicKey,
  groupThread: PublicKey,
  destinationWallet: PublicKey,
  messageAccount: PublicKey,
  adminIndex?: number,
  repliesTo?: PublicKey
) => {
  const instruction = new sendMessageGroupInstruction({
    kind: kind as number,
    message: Array.from(message),
    groupName,
    adminIndex: adminIndex ? new BN(adminIndex) : undefined,
    repliesTo: repliesTo ? repliesTo.toBuffer() : PublicKey.default.toBuffer(),
  }).getInstruction(
    JABBER_ID,
    SystemProgram.programId,
    sender,
    groupThread,
    destinationWallet,
    messageAccount,
    SOL_VAULT
  );

  return instruction;
};

/**
 *
 * @param connection The solana connection object to the RPC node
 * @param user The user to fetch the groups for
 * @returns
 */
export const retrieveUserGroups = async (
  connection: Connection,
  user: PublicKey
) => {
  const filters: MemcmpFilter[] = [
    {
      memcmp: {
        offset: 1 + 32,
        bytes: user.toBase58(),
      },
    },
    {
      memcmp: {
        offset: 0,
        bytes: "7",
      },
    },
  ];
  const result = await connection.getProgramAccounts(JABBER_ID, { filters });

  return result;
};

/**
 *
 * @param sender Original sender of the message
 * @param receiver Original receiver of the message
 * @param message Account of the message to delete
 * @param messageIndex Index of the message in the thread
 * @returns
 */
export const deleteMessage = async (
  sender: PublicKey,
  receiver: PublicKey,
  message: PublicKey,
  messageIndex: number
) => {
  const instruction = new deleteMessageInstruction({
    messageIndex,
  }).getInstruction(JABBER_ID, sender, receiver, message);

  return instruction;
};

/**
 *
 * @param groupThread Group thread address
 * @param message Account of the message to delete
 * @param feePayer Fee payer (either owner, admin or original sender)
 * @param messageIndex Index of the message in the thread
 * @param owner Owner of the group
 * @param groupName Name of the group
 * @param adminIndex The index of the admin in the list of admins (if feePayer is an admin) | undefined
 * @returns
 */
export const deleteGroupMessage = async (
  groupThread: PublicKey,
  message: PublicKey,
  feePayer: PublicKey,
  messageIndex: number,
  owner: PublicKey,
  groupName: string,
  adminIndex: number
) => {
  const instruction = new deleteGroupMessageInstruction({
    messageIndex,
    owner: owner.toBuffer(),
    adminIndex: adminIndex ? new BN(adminIndex) : undefined,
    groupName,
  }).getInstruction(JABBER_ID, groupThread, message, feePayer);

  return instruction;
};

/**
 *
 * @param subscribedTo The key to which the user is subscribing
 * @param subscriber The user subscribing to the key
 * @returns
 */
export const createSubscription = async (
  subscribedTo: PublicKey,
  subscriber: PublicKey
) => {
  const subscription = await Subscription.getKey(subscriber, subscribedTo);
  const ix = new createSubscriptionInstruction({
    subscribedTo: subscribedTo.toBuffer(),
  }).getInstruction(
    JABBER_ID,
    subscription,
    subscriber,
    SystemProgram.programId
  );
  return ix;
};

export const retrieveGroupMembers = async (
  connection: Connection,
  group: PublicKey
) => {
  const filters: MemcmpFilter[] = [
    {
      memcmp: {
        offset: 1,
        bytes: group.toBase58(),
      },
    },
    {
      memcmp: {
        offset: 0,
        bytes: "7",
      },
    },
  ];
  const result = await connection.getProgramAccounts(JABBER_ID, { filters });

  return result.map(
    (acc) => GroupThreadIndex.deserialize(acc.account.data).owner
  );
};

export const retrieveUserSubscription = async (
  connection: Connection,
  user: PublicKey
) => {
  const filters: MemcmpFilter[] = [
    {
      memcmp: {
        offset: 1,
        bytes: user.toBase58(),
      },
    },
    {
      memcmp: {
        offset: 0,
        bytes: "8",
      },
    },
  ];
  const result = await connection.getProgramAccounts(JABBER_ID, { filters });
  return result.map((acc) => Subscription.deserialize(acc.account.data));
};

/**
 * State
 */

export enum Tag {
  Uninitialized = 0,
  Profile = 1,
  Thread = 2,
  Message = 3,
  Jabber = 4,
  GroupThread = 5,
  GroupThreadIndex = 6,
  Subscription = 7,
}

export enum MessageType {
  Encrypted = 0,
  Unencrypted = 1,
  EncryptedImage = 2,
  UnencryptedImage = 3,
}

export class Profile {
  tag: Tag;
  bump: number;
  pictureHash: string;
  displayDomainName: string;
  bio: string;
  lamportsPerMessage: BN;
  allowDm: boolean;
  tipsSent: number;
  tipsReceived: number;

  static schema: Schema = new Map([
    [
      Profile,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["bump", "u8"],
          ["pictureHash", "string"],
          ["displayDomainName", "string"],
          ["bio", "string"],
          ["lamportsPerMessage", "u64"],
          ["allowDm", "u8"],
          ["tipsSent", "u64"],
          ["tipsReceived", "u64"],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: Tag;
    bump: number;
    pictureHash: string;
    displayDomainName: string;
    bio: string;
    lamportsPerMessage: BN;
    allowDm: boolean;
    tipsSent: number;
    tipsReceived: number;
  }) {
    this.tag = Tag.Profile;
    this.bump = obj.bump;
    this.pictureHash = obj.pictureHash;
    this.displayDomainName = obj.displayDomainName;
    this.bio = obj.bio;
    this.lamportsPerMessage = obj.lamportsPerMessage;
    this.allowDm = obj.allowDm;
    this.tipsSent = obj.tipsSent;
    this.tipsReceived = obj.tipsReceived;
  }

  static deserialize(data: Buffer): Profile {
    return deserializeUnchecked(this.schema, Profile, data);
  }

  static async retrieve(connection: Connection, owner: PublicKey) {
    const [profile] = await findProgramAddress(
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

  static async getKey(profileOwner: PublicKey) {
    const [profile] = await findProgramAddress(
      Profile.generateSeeds(profileOwner),
      JABBER_ID
    );
    return profile;
  }
}

export class Thread {
  tag: Tag;
  msgCount: number;
  user1: PublicKey;
  user2: PublicKey;
  lastMessageTime: BN;
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
          ["lastMessageTime", "u64"],
          ["bump", "u8"],
        ],
      },
    ],
  ]);

  constructor(obj: {
    msgCount: number;
    user1: Uint8Array;
    user2: Uint8Array;
    lastMessageTime: BN;
    bump: number;
  }) {
    this.tag = Tag.Thread;
    this.msgCount = obj.msgCount;
    this.user1 = new PublicKey(obj.user1);
    this.user2 = new PublicKey(obj.user2);
    this.lastMessageTime = obj.lastMessageTime;
    this.bump = obj.bump;
  }

  static deserialize(data: Buffer) {
    return deserialize(this.schema, Thread, data);
  }

  static generateSeeds(sender: PublicKey, receiver: PublicKey) {
    const [key1, key2] = orderKeys(sender, receiver);
    return [Buffer.from("thread"), key1.toBuffer(), key2.toBuffer()];
  }

  static async getKeys(sender: PublicKey, receiver: PublicKey) {
    const [thread] = await findProgramAddress(
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
    const [thread] = await findProgramAddress(
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
  sender: PublicKey;
  repliesTo: PublicKey;
  likesCount: number;
  dislikesCount: number;
  msg: Uint8Array;

  static schema: Schema = new Map([
    [
      Message,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["kind", "u8"],
          ["timestamp", "u64"],
          ["sender", [32]],
          ["repliesTo", [32]],
          ["likesCount", "u16"],
          ["dislikesCount", "u16"],
          ["msg", ["u8"]],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: Tag;
    kind: MessageType;
    timestamp: BN;
    sender: Uint8Array;
    repliesTo: Uint8Array;
    likesCount: number;
    dislikesCount: number;
    msg: Uint8Array;
  }) {
    this.tag = Tag.Message;
    this.kind = obj.kind;
    this.timestamp = obj.timestamp;
    this.sender = new PublicKey(obj.sender);
    this.repliesTo = new PublicKey(obj.repliesTo);
    this.likesCount = obj.likesCount;
    this.dislikesCount = obj.dislikesCount;
    this.msg = obj.msg;
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
    const [messageAccount] = await findProgramAddress(
      this.generateSeeds(index, sender, receiver),
      JABBER_ID
    );
    const accountInfo = await connection.getAccountInfo(messageAccount);
    if (!accountInfo?.data) {
      throw new Error("Invalid message info");
    }
    return this.deserialize(accountInfo.data);
  }

  static async retrieveFromIndexes(
    connection: Connection,
    indexes: number[],
    senderAddress: PublicKey,
    receiverAddress: PublicKey
  ) {
    const messageAccounts: PublicKey[] = [];
    for (const i of indexes) {
      const [acc] = await findProgramAddress(
        this.generateSeeds(i, senderAddress, receiverAddress),
        JABBER_ID
      );
      messageAccounts.push(acc);
    }
    const accountInfos = await connection.getMultipleAccountsInfo(
      messageAccounts
    );
    return accountInfos.map((info, i) =>
      info?.data
        ? deserializeMessage(
            info?.data as Buffer,
            messageAccounts[i],
            indexes[i],
            receiverAddress,
            senderAddress
          )
        : undefined
    );
  }

  static async retrieveFromThread(
    connection: Connection,
    sender: PublicKey,
    receiver: PublicKey,
    limit?: number
  ) {
    const thread = await Thread.retrieve(connection, sender, receiver);
    const messageAccounts: PublicKey[] = [];
    const start = limit ? limit : thread.msgCount;
    for (let i = 0; i < thread.msgCount; i++) {
      const [acc] = await findProgramAddress(
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
        ? deserializeMessage(
            info?.data as Buffer,
            messageAccounts[i],
            thread.msgCount - start + i,
            receiver,
            sender
          )
        : undefined
    );
  }
}

export class GroupThread {
  tag: Tag;
  bump: number;
  visible: boolean;
  owner: PublicKey;
  lastMessageTime: BN;
  destinationWallet: PublicKey;
  msgCount: number;
  lamportsPerMessage: BN;
  mediaEnabled: boolean;
  adminOnly: boolean;
  groupPicHash: string;
  groupName: string;
  admins: PublicKey[];

  static schema: Schema = new Map([
    [
      GroupThread,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["bump", "u8"],
          ["visible", "u8"],
          ["owner", [32]],
          ["lastMessageTime", "u64"],
          ["destinationWallet", [32]],
          ["msgCount", "u32"],
          ["lamportsPerMessage", "u64"],
          ["mediaEnabled", "u8"],
          ["adminOnly", "u8"],
          ["groupPicHash", "string"],
          ["groupName", "string"],
          ["admins", [[32]]],
        ],
      },
    ],
  ]);

  constructor(obj: {
    tag: Tag;
    bump: number;
    visible: boolean;
    owner: PublicKey;
    lastMessageTime: BN;
    destinationWallet: PublicKey;
    msgCount: number;
    lamportsPerMessage: BN;
    mediaEnabled: boolean;
    adminOnly: boolean;
    groupPicHash: string;
    groupName: string;
    admins: PublicKey[];
  }) {
    this.tag = Tag.GroupThread;
    this.bump = obj.bump;
    this.visible = obj.visible;
    this.owner = new PublicKey(obj.owner);
    this.lastMessageTime = obj.lastMessageTime;
    this.destinationWallet = new PublicKey(obj.destinationWallet);
    this.msgCount = obj.msgCount;
    this.lamportsPerMessage = obj.lamportsPerMessage;
    this.mediaEnabled = !!obj.mediaEnabled;
    this.adminOnly = !!obj.adminOnly;
    this.groupPicHash = obj.groupPicHash;
    this.groupName = obj.groupName;
    this.admins = obj.admins.map((e) => new PublicKey(e));
  }

  static deserialize(data: Buffer) {
    return deserializeUnchecked(this.schema, GroupThread, data);
  }

  static generateSeeds(groupName: string, owner: PublicKey) {
    return [
      Buffer.from("group_thread"),
      Buffer.from(groupName),
      owner.toBuffer(),
    ];
  }

  static async getKey(groupName: string, owner: PublicKey) {
    const [groupThread] = await findProgramAddress(
      GroupThread.generateSeeds(groupName, owner),
      JABBER_ID
    );
    return groupThread;
  }

  static async retrieve(
    connection: Connection,
    groupName: string,
    owner: PublicKey
  ) {
    const groupThreadKey = await GroupThread.getKey(groupName, owner);

    const accountInfo = await connection.getAccountInfo(groupThreadKey);

    if (!accountInfo?.data) {
      throw new Error("Group thread not found");
    }

    return this.deserialize(accountInfo.data);
  }

  static async retrieveFromKey(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);

    if (!accountInfo?.data) {
      throw new Error("Group thread not found");
    }

    return this.deserialize(accountInfo.data);
  }
}

export class GroupThreadIndex {
  tag: number;
  groupThreadKey: Uint8Array;
  owner: Uint8Array;
  groupName: string;

  static schema: Schema = new Map([
    [
      GroupThreadIndex,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["groupThreadKey", [32]],
          ["owner", [32]],
          ["groupName", "string"],
        ],
      },
    ],
  ]);

  constructor(obj: {
    groupName: string;
    groupThreadKey: Uint8Array;
    owner: Uint8Array;
  }) {
    this.tag = Tag.GroupThreadIndex;
    this.groupName = obj.groupName;
    this.groupThreadKey = obj.groupThreadKey;
    this.owner = obj.owner;
  }

  static deserialize(data: Buffer) {
    return deserializeUnchecked(this.schema, GroupThreadIndex, data);
  }

  static generateSeeds(
    groupName: string,
    owner: PublicKey,
    groupThreadKey: PublicKey
  ) {
    return [
      Buffer.from("group_thread_index"),
      Buffer.from(groupName),
      owner.toBuffer(),
      groupThreadKey.toBuffer(),
    ];
  }

  static async getKey(
    groupName: string,
    owner: PublicKey,
    groupThreadKey: PublicKey
  ) {
    const [groupThreadIndex] = await findProgramAddress(
      GroupThreadIndex.generateSeeds(groupName, owner, groupThreadKey),
      JABBER_ID
    );
    return groupThreadIndex;
  }

  static async retrieve(
    connection: Connection,
    groupName: string,
    owner: PublicKey,
    groupThreadKey: PublicKey
  ) {
    const groupThreadIndexKey = await GroupThreadIndex.getKey(
      groupName,
      owner,
      groupThreadKey
    );

    const accountInfo = await connection.getAccountInfo(groupThreadIndexKey);

    if (!accountInfo?.data) {
      throw new Error("Group index not found");
    }

    return this.deserialize(accountInfo.data);
  }

  static async retrieveFromKey(connection: Connection, key: PublicKey) {
    const accountInfo = await connection.getAccountInfo(key);

    if (!accountInfo?.data) {
      throw new Error("Group index not found");
    }

    return this.deserialize(accountInfo.data);
  }
}

export class Subscription {
  tag: number;
  subscriber: Uint8Array;
  subscribedTo: Uint8Array;

  static schema: Schema = new Map([
    [
      Subscription,
      {
        kind: "struct",
        fields: [
          ["tag", "u8"],
          ["subscriber", [32]],
          ["subscribedTo", [32]],
        ],
      },
    ],
  ]);

  constructor(obj: { subscriber: Uint8Array; subscribedTo: Uint8Array }) {
    this.tag = Tag.Subscription;
    this.subscriber = obj.subscriber;
    this.subscribedTo = obj.subscribedTo;
  }

  static deserialize(data: Buffer) {
    return deserializeUnchecked(this.schema, Subscription, data);
  }

  static generateSeeds(subscriber: PublicKey, subscribedTo: PublicKey) {
    return [
      Buffer.from("subscription"),
      subscriber.toBuffer(),
      subscribedTo.toBuffer(),
    ];
  }

  static async getKey(subscriber: PublicKey, subscribedTo: PublicKey) {
    const [subscriptionKey] = await findProgramAddress(
      Subscription.generateSeeds(subscriber, subscribedTo),
      JABBER_ID
    );
    return subscriptionKey;
  }
}

interface IDeserialize {
  message: Message;
  address: PublicKey;
  index: number;
  receiver: PublicKey;
  sender: PublicKey;
}

const deserializeMessage = (
  data: Buffer,
  address: PublicKey,
  index: number,
  receiver: PublicKey,
  sender: PublicKey
): IDeserialize => {
  const result = {
    message: Message.deserialize(data),
    address: address,
    index: index,
    receiver: receiver,
    sender: sender,
  };
  return result;
};
