import { Connection, PublicKey } from "@solana/web3.js";
import { NAME_PROGRAM_ID, NameRegistryState } from "@bonfida/spl-name-service";
import { getHashedName, getNameAccountKey } from "./name-service";
import BN from "bn.js";
import { findProgramAddress } from "./program-address";

export const PROGRAM_ID = new PublicKey(
  "jCebN34bUfdeUYJT13J1yG16XWQpt5PDx6Mse9GUqhR"
);

export async function findOwnedNameAccountsForUser(
  connection: Connection,
  userAccount: PublicKey
): Promise<PublicKey[]> {
  const filters = [
    {
      memcmp: {
        offset: 32,
        bytes: userAccount.toBase58(),
      },
    },
  ];
  const accounts = await connection.getProgramAccounts(NAME_PROGRAM_ID, {
    filters: filters,
  });
  return accounts.map((a) => a.pubkey);
}

export async function performReverseLookup(
  connection: Connection,
  nameAccount: PublicKey
): Promise<string> {
  let [centralState] = findProgramAddress([PROGRAM_ID.toBuffer()], PROGRAM_ID);
  let hashedReverseLookup = getHashedName(nameAccount.toBase58());
  let reverseLookupAccount = getNameAccountKey(
    hashedReverseLookup,
    centralState
  );

  let name = await NameRegistryState.retrieve(connection, reverseLookupAccount);
  if (!name.data) {
    throw new Error("Could not retrieve name data");
  }
  let nameLength = new BN(name.data.slice(0, 4), "le").toNumber();
  return name.data.slice(4, 4 + nameLength).toString();
}
