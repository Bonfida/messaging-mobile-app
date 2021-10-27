import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAsync } from "./utils";

export enum CachePrefix {
  Message = "message_",
  DecryptedMessage = "decrypted_message_",
  Media = "media_",
  DecryptedMedia = "decrypted_media_",
  MessageCount = "message_count_",
  RetrievedThread = "retrieved_thread_",
  LastMsgCount = "last_msg_count_",
  ProfilePicture = "profile_pic_",
}

export class asyncCache {
  static async get(key: string) {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) {
      return null;
    }
    return JSON.parse(cached);
  }
  static async set(key: string, value: any) {
    const stringified = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringified);
  }
}

export const useGetAsyncCache = (
  key: string,
  refresh: boolean,
  interval: number
) => {
  const fn = async () => {
    return await asyncCache.get(key);
  };
  return useAsync(fn, refresh, interval);
};
