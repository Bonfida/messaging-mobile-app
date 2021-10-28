import { Connection } from "@solana/web3.js";
import React, { useContext } from "react";
import "react-native-url-polyfill/auto";

const RPC_URL = "https://bonfida.rpcpool.com/b64b75e641d51f554dee2891c8f0";

interface IContext {
  connection: Connection;
}

const ConnectionContext: React.Context<null | IContext> =
  React.createContext<null | IContext>(null);

export const ConnectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const connection = new Connection(RPC_URL, { commitment: "confirmed" });
  return (
    <ConnectionContext.Provider
      value={{
        connection,
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
