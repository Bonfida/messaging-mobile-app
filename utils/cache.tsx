import React, { useContext, useRef, useState, MutableRefObject } from "react";

export enum CachePrefix {
  Message = "message_",
  DecryptedMessage = "decrypted_message_",
  Media = "media_",
  DecryptedMedia = "decrypted_media_",
  MessageCount = "message_count_",
  RetrievedThread = "retrieved_thread_",
}

interface IContext {
  cache: MutableRefObject<{} | null>;
  getCache: (key: string) => any;
  setCache: (key: string, value: any) => void;
}

const CacheContext: React.Context<null | IContext> =
  React.createContext<null | IContext>(null);

export const CacheProvider = ({ children }: { children: React.ReactNode }) => {
  const [cacheData, setCacheData] = useState({});
  const cache = useRef<null | {}>(null);
  cache.current = cacheData;

  const getCache = (key: string) => {
    // @ts-ignore
    return cacheData[key];
  };

  const setCache = (key: string, value: any) => {
    const copy = JSON.parse(JSON.stringify(cacheData));
    copy[key] = value;
    setCacheData(copy);
  };

  return (
    <CacheContext.Provider
      value={{
        cache: cache,
        setCache,
        getCache,
      }}
    >
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error("Missing cache context");
  }
  return context;
};
