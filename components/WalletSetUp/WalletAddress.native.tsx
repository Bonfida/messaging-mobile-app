import React, { useEffect } from "react";
import { StyleSheet, SafeAreaView, Text, View } from "react-native";
import GradientCard from "../Cards/GradientCard";
import { IStep } from "../../types";
import BlueTextGradient from "../TextGradients/BlueTextGradient";
import { useWallet } from "../../utils/wallet.native";
import GradientButton from "../Buttons/GradientButton";
import BlueButton from "../Buttons/BlueGradient";
import GlobalStyle from "../../Style";
import { abbreviateAddress } from "../../utils/utils.native";

const ButtonSection = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  const onPressImport = () => {
    setStep(IStep.CreateWallet);
  };
  const onPressCreate = () => {
    setStep(IStep.BuyDomain);
  };

  return (
    <View style={styles.buttonSection}>
      <BlueButton
        style={styles.buttonStyle}
        onPress={onPressImport}
        borderRadius={28}
        width={103}
        height={56}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Back</Text>
      </BlueButton>
      <GradientButton
        style={styles.buttonStyle}
        onPress={onPressCreate}
        borderRadius={28}
        width={208}
        height={56}
      >
        <Text style={[GlobalStyle.blue, styles.buttonText]}>Get connected</Text>
      </GradientButton>
    </View>
  );
};

export const WalletAddress = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  const { wallet, refresh } = useWallet();
  const len = wallet?.publicKey.toBase58().length;

  useEffect(() => {
    refresh();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.explanationContainer}>
        <GradientCard borderRadius={20} height={200} width={"100%"}>
          <View style={styles.innerCard}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>👇</Text>
            </View>
            <View style={styles.addressContainer}>
              <BlueTextGradient
                text={wallet?.publicKey.toBase58()}
                textStyle={styles.address}
                maskStyle={styles.mask}
              />
            </View>
          </View>
        </GradientCard>
        <Text style={[GlobalStyle.h1, { marginTop: 10 }]}>Wallet address</Text>
        <Text style={[GlobalStyle.text, { marginTop: 10 }]}>
          This is your unique wallet address. Moving forward, this will allow
          you to interact with the Solana blockchain.
        </Text>
      </View>
      <ButtonSection setStep={setStep} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  innerCard: {
    position: "relative",
    height: "100%",
  },
  address: {
    fontSize: 24,
    flexShrink: 1,
  },
  addressContainer: {
    bottom: 10,
    position: "absolute",
    width: "100%",
    left: 10,
  },
  mask: {
    height: 30,
  },
  emoji: {
    fontSize: 68,
  },
  emojiContainer: {
    position: "absolute",
    top: 5,
    left: 0,
  },
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
  explanationContainer: {
    width: "90%",
    marginLeft: "5%",
    marginRight: "5%",
  },
});
