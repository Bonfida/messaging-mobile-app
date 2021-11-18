import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Wallet from "@project-serum/sol-wallet-adapter";
import Modal from "../components/Modal";
import { WalletAdapter } from "./wallet-adapters";
import { useLocalStorageState } from "../utils/utils";
import { RPC_URL } from "./connection";
import { Text, View, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useConnection } from "./connection";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAsync } from "./utils.native";
import { sendTransaction } from "./send";

export const WALLET_PROVIDERS = [
  {
    name: "sollet.io",
    url: "https://www.sollet.io",
  },
];

const WalletContext = React.createContext<any>(null); // eslint-disable-line

// eslint-disable-next-line
export function WalletProvider({ children = null as any }) {
  const endpoint = RPC_URL;
  const connection = useConnection();
  const [autoConnect, setAutoConnect] = useState(false);
  const [providerUrl, setProviderUrl] = useLocalStorageState("walletProvider");
  const [solBalance, setSolBalance] = useState(0);

  const provider = useMemo(
    () => WALLET_PROVIDERS.find(({ url }) => url === providerUrl),
    [providerUrl]
  );

  const wallet = useMemo(
    function () {
      if (provider) {
        return new (provider.adapter || Wallet)(
          providerUrl,
          endpoint
        ) as WalletAdapter;
      }
    },
    [provider, providerUrl, endpoint]
  );

  const [connected, setConnected] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const hasSol = async () => {
    if (!wallet) return false;
    const _balance = await connection.getBalance(wallet?.publicKey);
    setSolBalance(_balance / LAMPORTS_PER_SOL);
    return _balance > 0;
  };

  useEffect(() => {
    if (!connected) return setIsModalVisible(true);
    setIsModalVisible(false);
  }, [connected]);

  useEffect(() => {
    if (wallet) {
      wallet.on("connect", () => {
        if (wallet.publicKey) {
          console.log("connected");
          localStorage.removeItem("feeDiscountKey");
          setConnected(true);
        }
      });

      wallet.on("disconnect", () => {
        setConnected(false);
        localStorage.removeItem("feeDiscountKey");
      });
    }

    return () => {
      setConnected(false);
      if (wallet) {
        wallet.disconnect();
        setConnected(false);
      }
    };
  }, [wallet]);

  useEffect(() => {
    if (wallet && autoConnect) {
      wallet.connect();
      setAutoConnect(false);
    }
    // eslint-disable-next-line
    return () => {};
  }, [wallet, autoConnect]);

  const select = useCallback(() => setIsModalVisible(true), []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connected,
        select,
        providerUrl,
        setProviderUrl,
        providerName:
          WALLET_PROVIDERS.find(({ url }) => url === providerUrl)?.name ??
          providerUrl,
        sendTransaction,
        hasSol,
        solBalance,
      }}
    >
      {children}
      <Modal animationType="fade" transparent={true} visible={isModalVisible}>
        <View style={styles.root}>
          <Text>Connect to a wallet</Text>
          <View>
            {WALLET_PROVIDERS.map((provider) => {
              const onClick = function () {
                setProviderUrl(provider.url);
                setAutoConnect(true);
              };
              return (
                <TouchableOpacity
                  style={styles.buttonContainer}
                  key={provider.url}
                  onPress={onClick}
                >
                  <Text style={styles.buttonText}>{provider.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </WalletContext.Provider>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    margin: 10,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: 200,
  },
  buttonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  root: {
    flex: 1,
    height: "100%",
    justifyContent: "center",
    backgroundColor: "rgb(240 ,240, 240)",
    alignItems: "center",
  },
});

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("Missing wallet context");
  }

  const wallet = context.wallet;
  return {
    connected: context.connected,
    wallet: wallet,
    providerUrl: context.providerUrl,
    setProvider: context.setProviderUrl,
    providerName: context.providerName,
    select: context.select,
    connect() {
      wallet ? wallet.connect() : context.select();
    },
    disconnect() {
      wallet?.disconnect();
    },
    sendTransaction: sendTransaction,
    hasSol: context.hasSol,
    solBalance: context.solBalance,
  };
}

export const useBalance = (refresh: boolean) => {
  const { wallet } = useWallet();
  const connection = useConnection();

  const fn = async () => {
    if (!wallet || !connection) return;
    const response = await connection.getBalance(wallet.publicKey);
    return response / LAMPORTS_PER_SOL;
  };

  return useAsync(fn, refresh != !!wallet);
};
