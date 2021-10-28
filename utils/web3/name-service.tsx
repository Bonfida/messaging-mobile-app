import { Buffer } from "buffer";
import {
  HASH_PREFIX,
  NAME_PROGRAM_ID,
  TWITTER_ROOT_PARENT_REGISTRY_KEY,
  TWITTER_VERIFICATION_AUTHORITY,
  ReverseTwitterRegistryState,
} from "@bonfida/spl-name-service";
import { ethers } from "ethers";
import { PublicKey, Connection } from "@solana/web3.js";
import { findProgramAddress } from "./program-address";

export function getHashedName(name: string): Buffer {
  const input = HASH_PREFIX + name;
  const buffer = ethers.utils.sha256(Buffer.from(input)).slice(2);
  return Buffer.from(buffer, "hex");
}

export function getNameAccountKey(
  hashed_name: Buffer,
  nameClass?: PublicKey,
  nameParent?: PublicKey
): PublicKey {
  const seeds = [hashed_name];
  if (nameClass) {
    seeds.push(nameClass.toBuffer());
  } else {
    seeds.push(Buffer.alloc(32));
  }
  if (nameParent) {
    seeds.push(nameParent.toBuffer());
  } else {
    seeds.push(Buffer.alloc(32));
  }
  const [nameAccountKey] = findProgramAddress(seeds, NAME_PROGRAM_ID);
  return nameAccountKey;
}
export async function getHandleAndRegistryKey(
  connection: Connection,
  verifiedPubkey: PublicKey
): Promise<[string, PublicKey]> {
  const hashedVerifiedPubkey = getHashedName(verifiedPubkey.toString());
  const reverseRegistryKey = getNameAccountKey(
    hashedVerifiedPubkey,
    TWITTER_VERIFICATION_AUTHORITY,
    TWITTER_ROOT_PARENT_REGISTRY_KEY
  );

  const reverseRegistryState = await ReverseTwitterRegistryState.retrieve(
    connection,
    reverseRegistryKey
  );
  return [
    reverseRegistryState.twitterHandle,
    new PublicKey(reverseRegistryState.twitterRegistryKey),
  ];
}
