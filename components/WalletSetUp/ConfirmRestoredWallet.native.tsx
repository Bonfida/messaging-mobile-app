import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { loadKeyPairFromMnemonicOrPrivateKey } from "../../utils/wallet.native";
import { IStep } from "../../types";

export const ConfirmRestoredWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  const [address, setAddress] = useState<null | string>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    const fn = async () => {
      if (!mountedRef.current) return;
      const mnemonic = await SecureStore.getItemAsync("mnemonic");
      if (!mnemonic) return;
      const [account] = await loadKeyPairFromMnemonicOrPrivateKey(mnemonic);
      if (!mountedRef.current || !account) return null;
      setAddress(account.publicKey.toBase58());
    };
    fn();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View>
        <Text style={styles.text}>Confirm your address 👇</Text>
        <Text style={styles.address}>{address}</Text>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => setStep(IStep.Restore)}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => setStep(IStep.BuyDomain)}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  text: {
    textAlign: "center",
    fontSize: 16,
    marginLeft: 10,
    marginRight: 10,
  },
  address: {
    height: 40,
    margin: 12,
    padding: 10,
    fontWeight: "bold",
  },
  buttonContainer: {
    margin: 20,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "40%",
  },
  buttonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
