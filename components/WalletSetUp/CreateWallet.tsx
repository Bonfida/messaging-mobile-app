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
} from "../../utils/wallet";
import * as SecureStore from "expo-secure-store";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import { Step } from "../../types";

export const CreateWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<Step>>;
}) => {
  const [mnemonic, setMnemonic] = useState<null | string>(null);
  const [copied, setCopied] = useState(false);
  const [userCopied, setUserCopied] = useState(false);

  useEffect(() => {
    const fn = async () => {
      if (mnemonic) return;
      const { mnemonic: _mnemonic, seed } = await generateMnemonicAndSeed();
      const normalized = normalizeMnemonic(_mnemonic);
      getAccountFromSeed(seed);
      setMnemonic(normalized);
      await SecureStore.setItemAsync("mnemonic", normalized);
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
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Seed words</Text>
      <Text style={styles.explanation}>
        Please write down the following twenty four words and keep them in a
        safe place:
      </Text>
      <TouchableOpacity onPress={copySeeds}>
        <Text style={styles.seedsContainer}>{mnemonic}</Text>
      </TouchableOpacity>
      <Text style={styles.explanation}>
        {copied && (
          <>
            Copied <Feather name="check" size={15} color="green" />
          </>
        )}
      </Text>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => setStep(Step.Welcome)}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!userCopied}
          style={styles.buttonContainer}
          onPress={() => setStep(Step.BuyDomain)}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  explanation: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
  },
  seedsContainer: {
    borderWidth: 0.5,
    borderColor: "grey",
    margin: "5%",
    padding: "5%",
    textAlign: "center",
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
