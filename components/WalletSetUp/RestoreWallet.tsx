import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { loadKeyPairFromMnemonicOrPrivateKey } from "../../utils/wallet";
import * as SecureStore from "expo-secure-store";
import "text-encoding-polyfill";
import { Step } from "../../types";

export const RestoreWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<Step>>;
}) => {
  const [mnemonic, setMnemonic] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  const handleOnPress = async () => {
    if (!mnemonic) {
      return alert("Please enter your seed");
    }
    try {
      setLoading(true);
      const [account, normalized] = await loadKeyPairFromMnemonicOrPrivateKey(
        mnemonic
      );
      if (!account || !normalized) {
        return alert("Invalid input");
      }

      await SecureStore.setItemAsync("mnemonic", normalized);
      setLoading(false);
      setStep(Step.ConfirmRestore);
    } catch (err) {
      setLoading(false);
      console.log(err);
      alert("Invalid seeds");
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View>
        <Text style={styles.text}>
          Restore your wallet using your twenty-four seed words or private key.{" "}
        </Text>
        <TextInput style={styles.input} onChangeText={setMnemonic} />
        {loading ? (
          <ActivityIndicator />
        ) : (
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={() => setStep(Step.Welcome)}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buttonContainer}
              onPress={handleOnPress}
            >
              <Text style={styles.buttonText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
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
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
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
