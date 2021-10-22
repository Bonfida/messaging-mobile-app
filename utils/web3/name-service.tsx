import { Buffer } from "buffer";
import { HASH_PREFIX, NAME_PROGRAM_ID } from "@bonfida/spl-name-service";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";
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
