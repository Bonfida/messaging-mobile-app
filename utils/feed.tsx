import { PublicKey } from "@solana/web3.js";
import { findProgramAddress } from "./web3/program-address";
import { JABBER_ID } from "@bonfida/jabber";

const PREFIX = Buffer.from("jabber_feed");

export const findFeedAddress = async (owner: PublicKey) => {
  const seeds = [PREFIX, owner.toBuffer()];
  const [key] = await findProgramAddress(seeds, JABBER_ID);
  return key;
};
