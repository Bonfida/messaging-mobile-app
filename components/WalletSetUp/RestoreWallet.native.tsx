import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { loadKeyPairFromMnemonicOrPrivateKey } from "../../utils/wallet.native";
import * as SecureStore from "expo-secure-store";
import "text-encoding-polyfill";
import { IStep } from "../../types";
import GlobalStyle from "../../Style";
import BlueButton, { BlueButtonWhiteBg } from "../Buttons/BlueGradient";
import { TWFWrapper } from "../../utils/utils.native";

const ButtonSection = ({
  setStep,
  onPressConfirm,
  disabled,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
  onPressConfirm: () => Promise<void>;
  disabled: boolean;
}) => {
  const handleOnPressBack = () => {
    setStep(IStep.Welcome);
  };
  const handleOnPressCreate = async () => {
    await onPressConfirm();
    setStep(IStep.ConfirmRestore);
  };

  return (
    <View style={styles.buttonSection}>
      <BlueButtonWhiteBg
        style={styles.buttonStyle}
        onPress={handleOnPressBack}
        borderRadius={28}
        width={103}
        height={56}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Back</Text>
      </BlueButtonWhiteBg>
      <BlueButton
        style={styles.buttonStyle}
        onPress={handleOnPressCreate}
        borderRadius={28}
        width={208}
        height={56}
        transparent
        disabled={disabled}
      >
        <Text style={[GlobalStyle.white, styles.buttonText]}>Confirm</Text>
      </BlueButton>
    </View>
  );
};

export const RestoreWallet = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
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
      setStep(IStep.ConfirmRestore);
    } catch (err) {
      setLoading(false);
      console.log(err);
      alert("Invalid seeds");
    }
  };

  return (
    <TWFWrapper>
      <SafeAreaView style={styles.root}>
        <View style={styles.container}>
          <TextInput
            multiline={true}
            style={styles.input}
            onChangeText={setMnemonic}
          />
          <Text style={styles.h1}>Restore your wallet</Text>
          <Text style={styles.text}>
            Restore your wallet with your 24 seed phrases or private key.
          </Text>
        </View>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <ButtonSection
            setStep={setStep}
            onPressConfirm={handleOnPress}
            disabled={!mnemonic}
          />
        )}
      </SafeAreaView>
    </TWFWrapper>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
  input: {
    padding: 20,
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 8,
    height: 90,
    fontSize: 16,
    ...GlobalStyle.blue,
  },
  container: {
    width: "90%",
  },
  h1: {
    marginTop: 20,
    ...GlobalStyle.h1,
  },
  text: {
    marginTop: 10,
    ...GlobalStyle.text,
  },
  buttonSection: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonStyle: {
    margin: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
