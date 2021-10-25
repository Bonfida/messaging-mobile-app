import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { useWallet } from "../utils/wallet";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "../utils/connection";
import { Thread, Message, sendMessage } from "../utils/web3/jabber";
import { findProgramAddress } from "../utils/web3/program-address";
import { signAndSendTransactionInstructions, sleep } from "../utils/utils";
import { encryptMessageToBuffer } from "../utils/jabber";
import { JABBER_ID, MessageType } from "@bonfida/jabber";
import { Ionicons } from "@expo/vector-icons";
import UploadIpfsButton from "../components/UploadIpfsButton";

export const MessageInput = ({ contact }: { contact: string }) => {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const connection = useConnection();

  const handeleOnSubmit = async () => {
    if (!message || !wallet) return;
    try {
      setLoading(true);
      const receiver = new PublicKey(contact);

      const thread = await Thread.retrieve(
        connection,
        receiver,
        wallet.publicKey
      );

      const seeds = Message.generateSeeds(
        thread.msgCount,
        receiver,
        wallet.publicKey
      );
      const [messageAccount] = findProgramAddress(seeds, JABBER_ID);

      const encrypted = encryptMessageToBuffer(
        message,
        wallet,
        receiver,
        messageAccount
      );

      const instruction = await sendMessage(
        connection,
        wallet.publicKey,
        receiver,
        encrypted,
        MessageType.Encrypted
      );

      const tx = await signAndSendTransactionInstructions(
        connection,
        [],
        wallet,
        [instruction]
      );
      console.log(tx);
      setMessage(undefined);
      await sleep(800);
    } catch {
      Alert.alert("Error", "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.textInput}>
      <TextInput
        value={message}
        style={styles.input}
        onChangeText={setMessage}
        placeholder="New Message"
        onSubmitEditing={handeleOnSubmit}
      />
      <TouchableOpacity disabled={!message} onPress={handeleOnSubmit}>
        {loading ? (
          <ActivityIndicator style={styles.icon} size="small" />
        ) : (
          <Ionicons style={styles.icon} name="send" size={24} color="blue" />
        )}
      </TouchableOpacity>
      <UploadIpfsButton receiver={contact} />
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  input: {
    padding: 10,
    borderWidth: 0.5,
    borderRadius: 20,
    margin: 20,
    width: "70%",
  },
  icon: {
    marginRight: 20,
  },
});
