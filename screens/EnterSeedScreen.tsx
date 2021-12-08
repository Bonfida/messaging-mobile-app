import React from "react";
import { IStep } from "../types";

const Dummy = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  step,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setStep,
}: {
  step: IStep;
  setStep: React.Dispatch<React.SetStateAction<IStep>>;
}) => {
  return null;
};

export default Dummy;
