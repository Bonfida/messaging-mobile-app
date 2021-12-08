import React from "react";
import { SafeAreaView, Text, View, StyleSheet } from "react-native";
import { useWallet } from "../../utils/wallet.native";
import { IStep } from "../../types";
import SolDomainCard from "../Cards/SolDomainCard";
import TwitterCard from "../Cards/TwitterCard";
import GlobalStyle from "../../Style";
import BlueButton, { BlueButtonWhiteBg } from "../Buttons/BlueGradient";

const ButtonSection = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  const { refresh, setCreated } = useWallet();
  const onPressBack = () => {
    setStep(IStep.CheckAddress);
  };
  const onPressFinish = async () => {
    await setCreated(true);
    refresh();
  };

  return (
    <View style={styles.buttonSection}>
      <BlueButtonWhiteBg
        style={styles.buttonStyle}
        onPress={onPressBack}
        borderRadius={28}
        width={103}
        height={56}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Back</Text>
      </BlueButtonWhiteBg>
      <BlueButton
        style={styles.buttonStyle}
        onPress={onPressFinish}
        borderRadius={28}
        width={208}
        height={56}
        transparent
      >
        <Text style={[GlobalStyle.white, styles.buttonText]}>
          Finish set up
        </Text>
      </BlueButton>
    </View>
  );
};

export const BuyDomain = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  return (
    <SafeAreaView style={styles.root}>
      <View style={{ width: "95%" }}>
        <SolDomainCard />
        <TwitterCard />
        <Text style={[GlobalStyle.h1, { marginTop: 20, marginBottom: 10 }]}>
          Get connected
        </Text>
        <Text style={GlobalStyle.text}>
          This is your unique wallet address. Moving forward, this will allow
          you to interact with the Solana blockchain.
        </Text>
      </View>

      <ButtonSection setStep={setStep} />
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
