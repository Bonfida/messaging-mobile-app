import React, { useState } from "react";
import { RestoreWallet } from "../components/WalletSetUp/RestoreWallet";
import { Welcome } from "../components/WalletSetUp/Welcome";
import { CreateWallet } from "../components/WalletSetUp/CreateWallet";
import { BuyDomain } from "../components/WalletSetUp/BuyDomain";
import { ConfirmRestoredWallet } from "../components/WalletSetUp/ConfirmRestoredWallet";
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
