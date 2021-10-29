import { PublicKey, Connection } from "@solana/web3.js";
import { abbreviateAddress, useAsync } from "./utils";
import { asyncCache } from "./cache";
import {
  findOwnedNameAccountsForUser,
  performReverseLookup,
} from "./web3/name-auctionning";
import { getHandleAndRegistryKey } from "./web3/name-service";
import { useConnection } from "./connection";
import { useWallet } from "./wallet";

export const SOL_TLD_AUTHORITY = new PublicKey(
  "58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx"
);

// Some old domains don't have a reverse look up set up
const findValidAddress = async (connection: Connection, address: PublicKey) => {
  try {
    const display = await performReverseLookup(connection, address);
    return display + ".sol";
  } catch (err) {
    console.log(err);
  }
  return undefined;
};

export const findDisplayName = async (
  connection: Connection,
  receiver: string
) => {
  try {
    const knownReceiver = await asyncCache.get(receiver);
    if (knownReceiver) {
      return knownReceiver;
    }
    const domainsAddresses = await findOwnedNameAccountsForUser(
      connection,
      new PublicKey(receiver)
    );
    domainsAddresses.sort((a, b) => a.toBase58().localeCompare(b.toBase58()));
    if (domainsAddresses.length === 0) {
      return abbreviateAddress(receiver, 10);
    }

    for (const address of domainsAddresses) {
      const name = await findValidAddress(connection, address);
      if (name) {
        await asyncCache.set(receiver, name);
        return name;
      }
    }

    try {
      const [display] = await getHandleAndRegistryKey(
        connection,
        new PublicKey(receiver)
      );
      return "@" + display;
    } catch (err) {
      console.log(err);
    }

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
  } catch (err) {
    console.log(err);
  }
  try {
    await getHandleAndRegistryKey(connection, owner);
    return true;
  } catch (err) {
    console.log(err);
  }

  return false;
};

export const useUserHasDomainOrTwitter = () => {
  const { wallet } = useWallet();
  const connection = useConnection();

  const fn = async () => {
    let hasDomain = false;
    let hasTwitter = false;
    if (!wallet) return;
    try {
      const domainsAddresses = await findOwnedNameAccountsForUser(
        connection,
        wallet?.publicKey
      );
      hasDomain = domainsAddresses.length !== 0;
    } catch (err) {
      console.log(err);
    }

    try {
      await getHandleAndRegistryKey(connection, wallet.publicKey);
      hasTwitter = true;
    } catch (err) {
      console.log(err);
    }

    return { hasTwitter: hasTwitter, hasDomain: hasDomain };
  };

  return useAsync(fn, false);
};
