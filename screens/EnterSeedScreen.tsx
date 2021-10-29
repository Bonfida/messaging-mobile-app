import React, { useState } from "react";
import { RestoreWallet } from "../components/WalletSetUp/RestoreWallet";
import { Welcome } from "../components/WalletSetUp/Welcome";
import { CreateWallet } from "../components/WalletSetUp/CreateWallet";
import { BuyDomain } from "../components/WalletSetUp/BuyDomain";

const EnterSeedScreen = () => {
  const [step, setStep] = useState(0);
  return (
    <>
      {step === 0 && <Welcome setStep={setStep} />}
      {step === 1 && <RestoreWallet setStep={setStep} />}
      {step === 2 && <CreateWallet setStep={setStep} />}
      {step === 3 && <BuyDomain setStep={setStep} />}
    </>
  );
};

export default EnterSeedScreen;
