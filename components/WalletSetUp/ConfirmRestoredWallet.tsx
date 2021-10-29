import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { getAccountFromSeed } from "../../utils/wallet";
import * as bip39 from "bip39";
import { Step } from "../../types";

export const ConfirmRestoredWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<Step>>;
}) => {
  const [address, setAddress] = useState<null | string>(null);

  useEffect(() => {
    const fn = async () => {
      const mnemonic = await SecureStore.getItemAsync("mnemonic");
      if (!mnemonic) return;
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const account = getAccountFromSeed(seed.toString("hex"));
      setAddress(account.publicKey.toBase58());
    };
    fn();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View>
        <Text style={styles.text}>Confirm your address 👇</Text>
        <Text style={styles.address}>{address}</Text>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => setStep(Step.Restore)}
          >
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => setStep(Step.BuyDomain)}
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
