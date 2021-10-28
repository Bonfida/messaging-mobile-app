import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  generateMnemonicAndSeed,
  getAccountFromSeed,
  normalizeMnemonic,
  useWallet,
} from "../../utils/wallet";
import * as SecureStore from "expo-secure-store";

// Touch to copy

export const CreateWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [mnemonic, setMnemonic] = useState<null | string>(null);
  useEffect(() => {
    const fn = async () => {
      if (mnemonic) return;
      const { mnemonic: _mnemonic, seed } = await generateMnemonicAndSeed();
      const normalized = normalizeMnemonic(_mnemonic);
      const account = getAccountFromSeed(seed);
      setMnemonic(normalized);
      await SecureStore.setItemAsync("mnemonic", normalized);
    };
    fn();
  });
  return <Text>{mnemonic}</Text>;
};

const styles = StyleSheet.create({});
