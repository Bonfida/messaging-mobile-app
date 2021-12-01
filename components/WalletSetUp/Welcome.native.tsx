import React from "react";
import { SafeAreaView, Text, View, StyleSheet } from "react-native";
import { IStep } from "../../types";
import WelcomeCard from "../Cards/WelcomeCard";
import GlobalStyle from "../../Style";
import GradientButton from "../Buttons/GradientButton";
import BlueButton from "../Buttons/BlueGradient";

const ButtonSection = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  const onPressImport = () => {
    setStep(IStep.Restore);
  };
  const onPressCreate = () => {
    setStep(IStep.CreateWallet);
  };

  return (
    <View style={styles.buttonSection}>
      <BlueButton
        style={styles.buttonStyle}
        onPress={onPressImport}
        borderRadius={28}
        width={155}
        height={56}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Import</Text>
      </BlueButton>
      <GradientButton
        style={styles.buttonStyle}
        onPress={onPressCreate}
        borderRadius={28}
        width={155}
        height={56}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Create</Text>
      </GradientButton>
    </View>
  );
};

export const Welcome = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  return (
    <SafeAreaView style={styles.root}>
      <View>
        <WelcomeCard />
        <View style={styles.textContainer}>
          <Text style={[GlobalStyle.h1, { marginTop: 20 }]}>Wallet setup</Text>
          <Text style={[GlobalStyle.text, { marginTop: 10 }]}>
            To get started, you can import an existing wallet, or create a new
            one.
          </Text>
          <Text style={[GlobalStyle.text, { marginTop: 10 }]}>
            Setting up your wallet is similar to a creating an account so you
            can start sending and receiving messages.
          </Text>
        </View>
      </View>
      <ButtonSection setStep={setStep} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    marginTop: 10,
    marginLeft: "5%",
    marginRight: "5%",
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
  mask: {
    height: 30,
  },
  root: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
  },
});
