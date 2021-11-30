import React, { useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
// import { RestoreWallet } from "../components/WalletSetUp/RestoreWallet.native";
import { Welcome } from "../components/WalletSetUp/Welcome.native";
import { CreateWallet } from "../components/WalletSetUp/CreateWallet.native";
// import { BuyDomain } from "../components/WalletSetUp/BuyDomain.native";
// import { ConfirmRestoredWallet } from "../components/WalletSetUp/ConfirmRestoredWallet.native";
import { WalletAddress } from "../components/WalletSetUp/WalletAddress.native";
import { IStep } from "../types";
import GlobalStyles from "../Style";
import { Step } from "../components/steps";

const StepContainer = ({ step }: { step: IStep }) => {
  return (
    <View style={styles.stepContainer}>
      {/* Welcome */}
      <Step selected={step === IStep.Welcome} />
      {/* Restore or Create*/}
      <Step selected={step === IStep.Restore || step === IStep.CreateWallet} />
      {/* Confirm address */}
      <Step
        selected={step === IStep.ConfirmRestore || step === IStep.CheckAddress}
      />
      {/* Get connected */}
      <Step selected={step === IStep.BuyDomain} />
    </View>
  );
};

const EnterSeedScreen = () => {
  const [step, setStep] = useState(IStep.Welcome);
  return (
    <SafeAreaView style={GlobalStyles.container}>
      <StepContainer step={step} />
      {step === IStep.Welcome && <Welcome setStep={setStep} />}
      {step === IStep.CreateWallet && <CreateWallet setStep={setStep} />}
      {step === IStep.CheckAddress && <WalletAddress setStep={setStep} />}
    </SafeAreaView>
  );
};

export default EnterSeedScreen;

const styles = StyleSheet.create({
  stepContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginTop: 10,
  },
});
