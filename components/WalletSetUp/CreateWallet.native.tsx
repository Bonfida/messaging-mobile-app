import React, { useEffect, useState, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  generateMnemonicAndSeed,
  getAccountFromSeed,
  normalizeMnemonic,
} from "../../utils/wallet.native";
import * as SecureStore from "expo-secure-store";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import { IStep } from "../../types";
import GlobalStyle from "../../Style";
import BlueButton, { BlueButtonWhiteBg } from "../Buttons/BlueGradient";

export const CreateWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  const [mnemonic, setMnemonic] = useState<null | string>(null);
  const [copied, setCopied] = useState(false);
  const [userCopied, setUserCopied] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    const fn = async () => {
      if (!mountedRef.current) return;
      if (mnemonic) return;
      const { mnemonic: _mnemonic, seed } = await generateMnemonicAndSeed();
      const normalized = normalizeMnemonic(_mnemonic);
      getAccountFromSeed(seed);
      if (!mountedRef.current) return null;
      setMnemonic(normalized);
      await SecureStore.setItemAsync("mnemonic", normalized);
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
    <SafeAreaView style={styles.root}>
      <View>
        <TouchableOpacity onPress={copySeeds}>
          {mnemonic && (
            <Text style={styles.seedsContainer}>
              {mnemonic.split(" ").map((word, idx) => {
                return (
                  <Text
                    key={idx}
                    style={[
                      idx % 2 === 0 ? GlobalStyle.darkBlue : GlobalStyle.blue,
                      { fontWeight: "bold", fontSize: 18 },
                    ]}
                  >
                    {word}
                    {idx < mnemonic.length ? " " : null}
                  </Text>
                );
              })}
            </Text>
          )}
          {!mnemonic && (
            <View style={styles.loading}>
              <ActivityIndicator />
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.copied, GlobalStyle.darkBlue]}>
          {copied && (
            <>
              Copied <Feather name="check" size={15} color="green" />
            </>
          )}
        </Text>

        <View style={styles.explanationContainer}>
          <Text style={GlobalStyle.h1}>Seed phrase</Text>
          <Text style={GlobalStyle.text}>
            Write down the above 24 words and store them in a safe place. This
            is used as a unique identifier to reclaim your wallet.
          </Text>
        </View>
      </View>

      <View style={styles.container}>
        <BlueButtonWhiteBg
          width={103}
          height={56}
          borderRadius={28}
          onPress={() => setStep(IStep.Welcome)}
        >
          <Text style={[GlobalStyle.blue, styles.buttonText]}>Back</Text>
        </BlueButtonWhiteBg>
        <BlueButton
          disabled={!userCopied}
          width={208}
          height={56}
          borderRadius={28}
          onPress={() => setStep(IStep.CheckAddress)}
          transparent
        >
          <Text style={[GlobalStyle.white, styles.buttonText]}>Confirmed</Text>
        </BlueButton>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  loading: {
    margin: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  copied: {
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
  seedsContainer: {
    borderWidth: 1,
    borderColor: "grey",
    margin: "5%",
    padding: "5%",
    textAlign: "center",
    borderRadius: 8,
  },
  container: {
    width: "90%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  explanationContainer: {
    marginLeft: "5%",
    marginRight: "5%",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
