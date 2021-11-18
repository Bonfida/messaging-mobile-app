import { signAndSendTransactionInstructions } from "./utils.native";
import { Connection, Keypair, TransactionInstruction } from "@solana/web3.js";

export interface ISendTransaction {
  instruction: TransactionInstruction[];
  wallet: Keypair;
  signers: Keypair[];
  connection: Connection;
}

export const sendTransaction = async (params: ISendTransaction) => {
  return signAndSendTransactionInstructions(
    params.connection,
    params.signers,
    params.wallet,
    params.instruction
  );
};
