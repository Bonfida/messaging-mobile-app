import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { getAccountFromSeed, normalizeMnemonic } from "../utils/wallet.native";
import * as SecureStore from "expo-secure-store";
import * as Clipboard from "expo-clipboard";
import * as bip39 from "bip39";
import { Feather } from "@expo/vector-icons";
import bs58 from "bs58";
import GlobalStyle from "../Style";

const ExportSeed = () => {
  const [mnemonic, setMnemonic] = useState<null | string>(null);
  const [privateKey, setPrivateKey] = useState<null | string>(null);
  const [privateKeyBs58, setPrivateKeyBs58] = useState<null | string>(null);
  const [copied, setCopied] = useState(false);
  const [, setUserCopied] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const fn = async () => {
      if (!mountedRef.current) return;
      if (mnemonic) return;
      const _mnemonic = await SecureStore.getItemAsync("mnemonic");
      if (!_mnemonic) return;
      const normalized = normalizeMnemonic(_mnemonic);
      const seed = await bip39.mnemonicToSeed(normalized);

      const keypair = getAccountFromSeed(seed.toString("hex"));

      if (!mountedRef.current) return null;
      setPrivateKey(JSON.stringify(Array.from(Buffer.from(keypair.secretKey))));
      setMnemonic(normalized);
      setPrivateKeyBs58(bs58.encode(keypair.secretKey));
      return () => {
        mountedRef.current = false;
      };
    };
    fn();
  }, []);

  const copySeeds = (arg: string | null) => () => {
    if (!arg) return;
    Clipboard.setString(arg);
    setCopied(true);
    setUserCopied(true);
  };

  useEffect(() => {
    if (!copied) return;
    const timer = setInterval(() => {
      setCopied(false);
    }, 2_000);
    return () => clearInterval(timer);
  }, [copied]);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <Text style={GlobalStyle.h2}>Mnemonic</Text>
      <TouchableOpacity onPress={copySeeds(mnemonic)}>
        {mnemonic && <Text style={styles.seedsContainer}>{mnemonic}</Text>}
        {!mnemonic && (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        )}
      </TouchableOpacity>
      <Text style={GlobalStyle.h2}>Private key</Text>
      <TouchableOpacity onPress={copySeeds(privateKey)}>
        <Text style={styles.seedsContainer}>{privateKey}</Text>
      </TouchableOpacity>
      <Text style={GlobalStyle.h2}>Private key (base 58)</Text>
      <TouchableOpacity onPress={copySeeds(privateKeyBs58)}>
        <Text style={styles.seedsContainer}>{privateKeyBs58}</Text>
      </TouchableOpacity>
      <Text style={styles.explanation}>
        {copied && (
          <>
            Copied <Feather name="check" size={15} color="green" />
          </>
        )}
      </Text>
    </SafeAreaView>
  );
};

export default ExportSeed;

const styles = StyleSheet.create({
  safeAreaView: {
    height: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  seedsContainer: {
    borderWidth: 0.5,
    borderColor: "grey",
    margin: "5%",
    padding: "5%",
    textAlign: "center",
  },
  loading: {
    margin: 20,
  },
  explanation: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
  },
});
