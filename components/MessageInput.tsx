import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardEvent,
  ScrollView,
} from "react-native";
import { useWallet } from "../utils/wallet";
import { useConnection } from "../utils/connection";
import { Ionicons } from "@expo/vector-icons";
import UploadIpfsButton from "./UploadIpfsButton";
import { isWeb } from "../utils/utils";
import {
  sendMessageToContact,
  sendMessageToGroup,
} from "../utils/send_message";
import { balanceWarning } from "./BalanceWarning";
import {
  createGroupIndex,
  GroupThread,
  GroupThreadIndex,
} from "../utils/web3/jabber";
import { PublicKey } from "@solana/web3.js";
import { sleep, useKeyBoardOffset } from "../utils/utils.native";
import { keyBoardRef } from "../types";

export const MessageInput = ({
  contact,
  groupData,
  scrollViewRef,
  muted,
}: {
  contact: string;
  groupData?: GroupThread | null;
  scrollViewRef: React.MutableRefObject<ScrollView>;
  muted?: boolean;
}) => {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const { wallet, sendTransaction, hasSol } = useWallet();
  const [loading, setLoading] = useState(false);
  const connection = useConnection();
  const [height, setHeight] = useState(0);

  const isGroup = !!groupData;
  const keyboardOffset = useKeyBoardOffset();

  useEffect(() => {
    scrollViewRef.current.scrollToEnd({ animated: true });
  }, [keyboardOffset]);

  const handeleOnSubmit = async () => {
    if (!message || !wallet) return;
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    try {
      setLoading(true);

      if (isGroup) {
        const indexInfo = await connection.getAccountInfo(
          await GroupThreadIndex.getKey(
            groupData.groupName,
            groupData.owner,
            new PublicKey(contact)
          )
        );
        if (!indexInfo?.data) {
          const createIndexInstruction = await createGroupIndex(
            groupData.groupName,
            groupData.owner,
            new PublicKey(contact)
          );
          const tx = await sendTransaction({
            connection,
            wallet,
            instruction: [createIndexInstruction],
          });
          console.log(`Created a thread index account ${tx}`);
        }
      }

      let adminIndex: undefined | number = undefined;
      if (groupData && isGroup) {
        for (let i = 0; i < groupData.admins.length; i++) {
          if (groupData.admins[i].equals(wallet.publicKey)) {
            adminIndex = i;
          }
        }
      }

      const instruction = await (isGroup
        ? sendMessageToGroup(connection, contact, message, wallet, adminIndex)
        : sendMessageToContact(connection, contact, wallet, message));
      const tx = await sendTransaction({
        instruction: [instruction],
        wallet: wallet,
        signers: [],
        connection: connection,
      });
      console.log(tx);
      setMessage(undefined);
    } catch (err) {
      console.log(err);
      isWeb
        ? alert("Error sending message")
        : Alert.alert("Error", "Error sending message");
    } finally {
      // sleep for propagation
      await sleep(1_500);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.textInput, { marginBottom: keyboardOffset }]}>
      <TextInput
        editable={!muted}
        value={message}
        style={[styles.input, { height: Math.max(35, height) }]}
        onChangeText={setMessage}
        placeholder="New Message"
        onSubmitEditing={handeleOnSubmit}
        multiline={true}
        onContentSizeChange={(e) => setHeight(e.nativeEvent.contentSize.height)}
      />
      <TouchableOpacity disabled={!message} onPress={handeleOnSubmit}>
        {loading ? (
          <ActivityIndicator style={styles.icon} size="small" />
        ) : (
          <Ionicons style={styles.icon} name="send" size={24} color="blue" />
        )}
      </TouchableOpacity>
      {!isGroup && <UploadIpfsButton receiver={contact} />}
    </View>
  );
};

const styles = StyleSheet.create({
  textInput: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
