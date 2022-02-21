// import { RPC_URL } from "@env";
import { Connection } from "@solana/web3.js";
import React, { useContext, useMemo, useState } from "react";
import "react-native-url-polyfill/auto";

export const DEFAULT_RPC_URL = "https://api.devnet.rpcpool.com/";

if (!DEFAULT_RPC_URL) {
  throw new Error("RPC URL not found");
}

interface IContext {
  connection: Connection;
  setUrl: (arg: string) => Promise<void>;
}

const ConnectionContext: React.Context<null | IContext> =
  React.createContext<null | IContext>(null);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [url, setUrl] = useState(DEFAULT_RPC_URL);
  console.log("URL", url);
  const connection = useMemo(
    () =>
      new Connection(url, {
        commitment: "processed",
      }),
    [url]
  );

  const changeUrl = async (newUrl: string) => {
    if (!newUrl.startsWith("https://")) {
      throw new Error("Invalid url");
    }
    const result = await connection.getEpochInfo();
    console.log(result);
    setUrl(newUrl);
  };

  return (
    <ConnectionContext.Provider
      value={{
        connection,
        setUrl: changeUrl,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("Missing connection context");
  }
  return context.connection;
}

export const useChangeConnectionUrl = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error("Missing connection context");
  }
  return context.setUrl;
};
