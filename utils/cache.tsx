import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAsync } from "./utils";
import { ethers } from "ethers";
import { PublicKey } from "@solana/web3.js";
import { findProgramAddress } from "./web3/program-address";

export enum CachePrefix {
  Message = "message_",
  DecryptedMessage = "decrypted_message_",
  Media = "media_",
  DecryptedMedia = "decrypted_media_",
  MessageCount = "message_count_",
  RetrievedThread = "retrieved_thread_",
  LastMsgCount = "last_msg_count_",
  ProfilePicture = "profile_pic_",
  Archive = "archive_",
  CentralState = "central_state_",
  Sha256 = "sha256_",
  ProgramAddress = "program_address_",
}

export class asyncCache {
  static async get(key: string) {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached);
  }
  static async set<T>(key: string, value: T) {
    const stringified = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringified);
  }

  static async sha256(data: ethers.utils.BytesLike): Promise<string> {
    const cached: string = await asyncCache.get(
      CachePrefix.Sha256 + data.toString()
    );
    if (cached) {
      return cached;
    }
    const result: string = await new Promise((resolve) =>
      resolve(ethers.utils.sha256(data).slice(2))
    );
    await asyncCache.set(CachePrefix.Sha256 + data.toString(), result);
    return result;
  }

  // static async findProgramAddress(
  //   seeds: Array<Buffer | Uint8Array>,
  //   programId: PublicKey
  // ): Promise<[PublicKey, number]> {
  //   const cached: [string, number] = await asyncCache.get(
  //     CachePrefix.Sha256 +
  //       seeds.map((e) => e.toString()).concat() +
  //       programId.toBase58()
  //   );
  //   if (cached) {
  //     return [new PublicKey(cached[0]), cached[1]];
  //   }
  //   return await findProgramAddress(seeds, programId);
  // }
}

export const useGetAsyncCache = (
  key: string,
  refresh: boolean,
  interval?: number
) => {
  const fn = async () => {
    return await asyncCache.get(key);
  };
  return useAsync(fn, refresh, interval);
};
