import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useWallet } from "../utils/wallet";
import { useConnection } from "../utils/connection";
import { Ionicons } from "@expo/vector-icons";
import UploadIpfsButton from "./UploadIpfsButton.native";
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

const BlueArrow = () => {
  return <Ionicons style={styles.icon} name="send" size={24} color="#60C0CB" />;
};

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
  const mediaEnabled = !!groupData?.mediaEnabled;

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
        : Alert.alert("Error", "Error sending message0");
    } finally {
      // sleep for propagation
      await sleep(1_500);
      setLoading(false);
    }
  };

  return (
    <View style={[styles.textInput, { marginBottom: keyboardOffset }]}>
      {((isGroup && mediaEnabled && !muted) || !isGroup) && (
        <UploadIpfsButton receiver={contact} groupData={groupData} />
      )}
      <TextInput
        editable={!muted}
        value={message}
        style={[styles.input, { height: Math.max(32, height) }]}
        onChangeText={setMessage}
        placeholder="New Message"
        onSubmitEditing={handeleOnSubmit}
        placeholderTextColor="#C8CCD6"
        multiline={true}
        onContentSizeChange={(e) =>
          setHeight(1.5 * e.nativeEvent.contentSize.height)
        }
      />
      <TouchableOpacity disabled={!message} onPress={handeleOnSubmit}>
        {loading ? (
          <ActivityIndicator style={styles.icon} size="small" />
        ) : (
          <BlueArrow />
        )}
      </TouchableOpacity>
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
    margin: 10,
    backgroundColor: "#F0F5FF",
    borderRadius: 20,
    height: 40,
    width: "70%",
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    color: "#2A2346",
    paddingTop: 8,
    paddingLeft: 12,
  },
  icon: {
    marginRight: 20,
  },
});
