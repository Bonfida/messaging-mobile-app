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

const ExportSeed = () => {
  const [mnemonic, setMnemonic] = useState<null | string>(null);
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

      getAccountFromSeed(seed.toString("hex"));
      if (!mountedRef.current) return null;
      setMnemonic(normalized);
      return () => {
        mountedRef.current = false;
      };
    };
    fn();
  }, []);

  const copySeeds = () => {
    if (!mnemonic) return;
    Clipboard.setString(mnemonic);
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
      <TouchableOpacity onPress={copySeeds}>
        {mnemonic && <Text style={styles.seedsContainer}>{mnemonic}</Text>}
        {!mnemonic && (
          <View style={styles.loading}>
            <ActivityIndicator />
          </View>
        )}
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
  safeAreaView: { height: "100%" },
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
