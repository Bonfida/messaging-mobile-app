import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { RestoreWallet } from "../components/WalletSetUp/RestoreWallet";
import { Welcome } from "../components/WalletSetUp/Welcome";
import { CreateWallet } from "../components/WalletSetUp/CreateWallet";

// Step 0: Welcome screen
// Step 1: Restore screen
// Step 2: Create screen
// Step 3: Domain/Twitter explained
// Finished

const EnterSeedScreen = () => {
  const [step, setStep] = useState(0);

  return (
    <>
      {step === 0 && <Welcome setStep={setStep} />}
      {step === 1 && <RestoreWallet setStep={setStep} />}
      {step === 2 && <CreateWallet setStep={setStep} />}
    </>
  );
};

export default EnterSeedScreen;

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
});
