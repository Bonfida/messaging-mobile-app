import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Keyboard,
  EmitterSubscription,
  KeyboardEvent,
} from "react-native";
import { useWallet } from "../utils/wallet";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "../utils/connection";
import { Thread, Message, sendMessage } from "../utils/web3/jabber";
import { findProgramAddress } from "../utils/web3/program-address";
import { signAndSendTransactionInstructions } from "../utils/utils";
import { encryptMessageToBuffer } from "../utils/jabber";
import { JABBER_ID, MessageType } from "@bonfida/jabber";
import { Ionicons } from "@expo/vector-icons";
import UploadIpfsButton from "../components/UploadIpfsButton";

type keyBoardRef = React.MutableRefObject<EmitterSubscription | null>;

export const MessageInput = ({ contact }: { contact: string }) => {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const connection = useConnection();

  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const onKeyboardShow = (event: KeyboardEvent) =>
    setKeyboardOffset(event.endCoordinates.height);
  const onKeyboardHide = () => setKeyboardOffset(0);
  const keyboardDidShowListener = useRef(null) as keyBoardRef;
  const keyboardDidHideListener = useRef(null) as keyBoardRef;

  useEffect(() => {
    keyboardDidShowListener.current = Keyboard.addListener(
      "keyboardWillShow",
      onKeyboardShow
    );

    keyboardDidHideListener.current = Keyboard.addListener(
      "keyboardWillHide",
      onKeyboardHide
    );

    return () => {
      keyboardDidShowListener.current?.remove();
      keyboardDidHideListener.current?.remove();
    };
  }, []);

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
    } catch {
      Alert.alert("Error", "Error sending message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        ...styles.textInput,
        marginBottom: keyboardOffset,
      }}
    >
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
    marginTop: 10,
  },
  input: {
    padding: 10,
    borderWidth: 0.5,
    borderRadius: 20,
    margin: 10,
    width: "70%",
  },
  icon: {
    marginRight: 20,
  },
});
