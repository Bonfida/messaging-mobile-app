import React, { useState } from "react";
import { RestoreWallet } from "../components/WalletSetUp/RestoreWallet.native";
import { Welcome } from "../components/WalletSetUp/Welcome.native";
import { CreateWallet } from "../components/WalletSetUp/CreateWallet.native";
import { BuyDomain } from "../components/WalletSetUp/BuyDomain.native";
import { ConfirmRestoredWallet } from "../components/WalletSetUp/ConfirmRestoredWallet.native";
import { Step } from "../types";

const EnterSeedScreen = () => {
  const [step, setStep] = useState(Step.Welcome);
  return (
    <>
      {step === Step.Welcome && <Welcome setStep={setStep} />}
      {step === Step.Restore && <RestoreWallet setStep={setStep} />}
      {step === Step.ConfirmRestore && (
        <ConfirmRestoredWallet setStep={setStep} />
      )}
      {step === Step.CreateWallet && <CreateWallet setStep={setStep} />}
      {step === Step.BuyDomain && <BuyDomain setStep={setStep} />}
    </>
  );
};

export default EnterSeedScreen;
