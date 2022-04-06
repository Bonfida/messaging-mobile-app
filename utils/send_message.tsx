import { Connection, PublicKey } from "@solana/web3.js";
import { sendMessage, Thread, Message, GroupThread } from "./web3/jab";
import { findProgramAddress } from "./web3/program-address";
import { encryptMessageToBuffer } from "./jab";
import { JAB_ID, MessageType, sendMessageGroup } from "@bonfida/jab";

export const sendMessageToContact = async (
  connection: Connection,
  contact: string,
  // eslint-disable-next-line
  wallet: any,
  message: string
) => {
  const receiver = new PublicKey(contact);

  const thread = await Thread.retrieve(connection, receiver, wallet.publicKey);

  const seeds = Message.generateSeeds(
    thread.msgCount,
    receiver,
    wallet.publicKey
  );
  const [messageAccount] = await findProgramAddress(seeds, JAB_ID);

  const encrypted = encryptMessageToBuffer(
    message,
    wallet,
    receiver,
    messageAccount
  );

  const instruction = await sendMessage(
    connection,
    wallet.publicKey,
    receiver,
    encrypted,
    MessageType.Encrypted
  );

  return instruction;
};

export const sendMessageToGroup = async (
  connection: Connection,
  group: string,
  message: string,
  // eslint-disable-next-line
  wallet: any,
  adminIndex?: number
) => {
  const groupKey = new PublicKey(group);
  const groupThread = await GroupThread.retrieveFromKey(connection, groupKey);
  const seeds = Message.generateSeeds(groupThread.msgCount, groupKey, groupKey);

  const [messageAccount] = await findProgramAddress(seeds, JAB_ID);

  const instruction = await sendMessageGroup(
    MessageType.Unencrypted,
    new Uint8Array(Buffer.from(message)),
    groupThread.groupName,
    wallet.publicKey,
    groupKey,
    groupThread.destinationWallet,
    messageAccount,
    adminIndex
  );
  return instruction;
};
