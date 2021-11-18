import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { useConnection } from "./connection";
import { findProgramAddress } from "./web3/program-address";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useAsync } from "./utils.native";
import { Buffer } from "buffer";
import { ethers } from "ethers";

export const FIDA_MINT = new PublicKey(
  "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp"
);

export const FIDA_MULTIPLIER = Math.pow(10, 6);

/** The @solana/spl-token method does not work with react native */
export const createTransferInstruction = (
  programId: PublicKey,
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number
): TransactionInstruction => {
  const data = Buffer.alloc(1 + 8);
  const amountBN = ethers.BigNumber.from(amount).toBigInt();
  data.writeUInt8(3, 0);
  data.writeBigInt64LE(amountBN, 1);
  const keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
  ];
  keys.push({
    pubkey: owner,
    isSigner: true,
    isWritable: false,
  });

  return new TransactionInstruction({
    keys,
    programId: programId,
    data,
  });
};

export const getAssociatedTokenAccount = (
  owner: PublicKey,
  mint: PublicKey
) => {
  return findProgramAddress(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
};

export const useFidaBalance = (
  owner: PublicKey | undefined,
  refresh: boolean
) => {
  const connection = useConnection();
  const fn = async () => {
    if (!owner) return;
    const tokenAccount = (await getAssociatedTokenAccount(owner, FIDA_MINT))[0];
    const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
    return accountInfo.value.uiAmount;
  };
  return useAsync(fn, refresh);
};
