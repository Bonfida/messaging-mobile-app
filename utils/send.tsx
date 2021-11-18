/* eslint-disable */
import { sleep } from "./utils";
import {
  Commitment,
  Connection,
  RpcResponseAndContext,
  SimulatedTransactionResponse,
  SystemProgram,
  Transaction,
  TransactionSignature,
  TransactionInstruction,
  PublicKey,
  Keypair,
} from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const getUnixTs = () => {
  return new Date().getTime() / 1000;
};

const DEFAULT_TIMEOUT = 15000 * 3;

export async function sendTransaction({
  instruction,
  wallet,
  signers = [],
  connection,
}: {
  instruction: TransactionInstruction[];
  wallet: Wallet;
  signers?: Array<Keypair>;
  connection: Connection;
}) {
  const sendingMessage = "Sending transaction...";
  const sentMessage = "Transaction sent";
  const successMessage = "Transaction confirmed";
  const timeout = DEFAULT_TIMEOUT;

  const transaction = new Transaction().add(...instruction);

  if (wallet.isProgramWallet) {
    const signedTransaction = await covertToProgramWalletTransaction({
      transaction,
      wallet,
      signers,
      connection,
    });
    return await sendSignedTransaction({
      signedTransaction,
      connection,
      sendingMessage,
      sentMessage,
      successMessage,
      timeout,
    });
  } else {
    const signedTransaction = await signTransaction({
      transaction,
      wallet,
      signers,
      connection,
    });
    return await sendSignedTransaction({
      signedTransaction,
      connection,
      sendingMessage,
      sentMessage,
      successMessage,
      timeout,
    });
  }
}

export async function signTransaction({
  transaction,
  wallet,
  signers = [],
  connection,
}: {
  transaction: Transaction;
  wallet: Wallet;
  signers?: Array<Keypair>;
  connection: Connection;
}) {
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  transaction.setSigners(wallet.publicKey, ...signers.map((s) => s.publicKey));
  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }
  return await wallet.signTransaction(transaction);
}

async function covertToProgramWalletTransaction({
  transaction,
  wallet,
  signers = [],
  connection,
}: {
  transaction: Transaction;
  wallet: any;
  signers: Array<Keypair>;
  connection: Connection;
}) {
  transaction.recentBlockhash = (
    await connection.getRecentBlockhash("max")
  ).blockhash;
  transaction.feePayer = wallet.publicKey;
  if (signers.length > 0) {
    transaction = await wallet.convertToProgramWalletTransaction(transaction);
    transaction.partialSign(...signers);
  }
  return transaction;
}

export async function signTransactions({
  transactionsAndSigners,
  wallet,
  connection,
}: {
  transactionsAndSigners: {
    transaction: Transaction;
    signers?: Array<Keypair>;
  }[];
  wallet: Wallet;
  connection: Connection;
}) {
  const blockhash = (await connection.getRecentBlockhash("max")).blockhash;
  transactionsAndSigners.forEach(({ transaction, signers = [] }) => {
    transaction.recentBlockhash = blockhash;
    transaction.setSigners(
      wallet.publicKey,
      ...signers.map((s) => s.publicKey)
    );
    if (signers?.length > 0) {
      transaction.partialSign(...signers);
    }
  });
  return await wallet.signAllTransactions(
    transactionsAndSigners.map(({ transaction }) => transaction)
  );
}

export async function sendSignedTransaction({
  signedTransaction,
  connection,
  sendingMessage = "Sending transaction...",
  sentMessage = "Transaction sent",
  successMessage = "Transaction confirmed",
  timeout = DEFAULT_TIMEOUT,
}: {
  signedTransaction: Transaction;
  connection: Connection;
  sendingMessage?: string;
  sentMessage?: string;
  successMessage?: string;
  timeout?: number;
}): Promise<string> {
  const rawTransaction = signedTransaction.serialize();
  const startTime = getUnixTs();

  const txid: TransactionSignature = await connection.sendRawTransaction(
    rawTransaction,
    {
      skipPreflight: true,
    }
  );

  console.log("Started awaiting confirmation for", txid);

  let done = false;
  (async () => {
    while (!done && getUnixTs() - startTime < timeout) {
      connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      });
      await sleep(300);
    }
  })();
  try {
    await awaitTransactionSignatureConfirmation(txid, timeout, connection);
  } catch (err) {
    // @ts-ignore
    if (err.timeout) {
      throw new Error("Timed out awaiting confirmation on transaction");
    }
    let simulateResult: SimulatedTransactionResponse | null = null;
    try {
      simulateResult = (
        await simulateTransaction(connection, signedTransaction, "single")
      ).value;
    } catch (e) {}
    if (simulateResult && simulateResult.err) {
      if (simulateResult.logs) {
        for (let i = simulateResult.logs.length - 1; i >= 0; --i) {
          const line = simulateResult.logs[i];
          if (line.startsWith("Program log: ")) {
            throw new Error(
              "Transaction failed: " + line.slice("Program log: ".length)
            );
          }
        }
      }
      throw new Error(JSON.stringify(simulateResult.err));
    }
    throw new Error("Transaction failed");
  } finally {
    done = true;
  }

  console.log("Latency", txid, getUnixTs() - startTime);
  return txid;
}

async function awaitTransactionSignatureConfirmation(
  txid: TransactionSignature,
  timeout: number,
  connection: Connection
) {
  let done = false;
  const result = await new Promise((resolve, reject) => {
    (async () => {
      setTimeout(() => {
        if (done) {
          return;
        }
        done = true;
        console.log("Timed out for txid", txid);
        reject({ timeout: true });
      }, timeout);
      try {
        connection.onSignature(
          txid,
          (result) => {
            console.log("WS confirmed", txid, result);
            done = true;
            if (result.err) {
              reject(result.err);
            } else {
              resolve(result);
            }
          },
          "recent"
        );
        console.log("Set up WS connection", txid);
      } catch (e) {
        done = true;
        console.log("WS error in setup", txid, e);
      }
      while (!done) {
        // eslint-disable-next-line no-loop-func
        (async () => {
          try {
            const signatureStatuses = await connection.getSignatureStatuses([
              txid,
            ]);
            const result = signatureStatuses && signatureStatuses.value[0];
            if (!done) {
              if (!result) {
                console.log("REST null result for", txid, result);
              } else if (result.err) {
                console.log("REST error for", txid, result);
                done = true;
                reject(result.err);
              } else if (!result.confirmations) {
                console.log("REST no confirmations for", txid, result);
              } else {
                console.log("REST confirmation for", txid, result);
                done = true;
                resolve(result);
              }
            }
          } catch (e) {
            if (!done) {
              console.log("REST connection error: txid", txid, e);
            }
          }
        })();
        await sleep(300);
      }
    })();
  });
  done = true;
  return result;
}

/** Copy of Connection.simulateTransaction that takes a commitment parameter. */
async function simulateTransaction(
  connection: Connection,
  transaction: Transaction,
  commitment: Commitment
): Promise<RpcResponseAndContext<SimulatedTransactionResponse>> {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching
  );

  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString("base64");
  const config: any = { encoding: "base64", commitment };
  const args = [encodedTransaction, config];

  // @ts-ignore
  const res = await connection._rpcRequest("simulateTransaction", args);
  if (res.error) {
    throw new Error("failed to simulate transaction: " + res.error.message);
  }
  return res.result;
}

export const sendSplToken = async ({
  connection,
  owner,
  sourceSpl,
  destination,
  amount,
  wallet,
  isSol,
}: {
  connection: Connection;
  owner: PublicKey;
  sourceSpl: PublicKey;
  destination: PublicKey;
  amount: number;
  wallet: Wallet;
  isSol: boolean;
}) => {
  const signers: Array<Keypair> = [];
  let instructions: TransactionInstruction;
  if (isSol) {
    instructions = SystemProgram.transfer({
      fromPubkey: sourceSpl,
      toPubkey: destination,
      lamports: amount,
    });
  } else {
    instructions = Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      sourceSpl,
      destination,
      owner,
      signers,
      amount
    );
  }

  return await sendTransaction({
    instruction: [instructions],
    signers: signers,
    wallet: wallet,
    connection: connection,
  });
};
