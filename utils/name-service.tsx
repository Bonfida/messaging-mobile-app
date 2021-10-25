import { getHandleAndRegistryKey } from "@bonfida/spl-name-service";
import { PublicKey, Connection } from "@solana/web3.js";
import { abbreviateAddress, useAsync } from "./utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  findOwnedNameAccountsForUser,
  performReverseLookup,
} from "./web3/name-auctionning";
import { useConnection } from "./connection";

export const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);

export const findDisplayName = async (
  connection: Connection,
  receiver: string
) => {
  try {
    const knownReceiver = await AsyncStorage.getItem(receiver);
    if (!!knownReceiver) {
      return knownReceiver;
    }
    let domainsAddresses = await findOwnedNameAccountsForUser(
      connection,
      new PublicKey(receiver)
    );
    domainsAddresses.sort((a, b) => a.toBase58().localeCompare(b.toBase58()));
    if (domainsAddresses.length === 0) {
      return abbreviateAddress(receiver, 10);
    }
    try {
      const display = await performReverseLookup(
        connection,
        domainsAddresses[0]
      );
      return display + ".sol";
    } catch {}
    try {
      const [display] = await getHandleAndRegistryKey(
        connection,
        domainsAddresses[0]
      );
      return "@" + display;
    } catch (err) {}
    return abbreviateAddress(receiver, 10);
  } catch (err) {
    console.log(err);
    return undefined;
  }
};

export const useDisplayName = (contact: string) => {
  const connection = useConnection();

  const fn = async () => {
    return await findDisplayName(connection, contact);
  };

  return useAsync(fn, false);
};

export const ownerHasDomain = async (
  connection: Connection,
  owner: PublicKey
) => {
  try {
    const domainsAddresses = await findOwnedNameAccountsForUser(
      connection,
      owner
    );
    return domainsAddresses.length != 0;
  } catch {}
  return false;
};
