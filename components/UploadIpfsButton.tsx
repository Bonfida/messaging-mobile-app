import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Entypo } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import mime from "mime";
import { Thread, Message, sendMessage } from "../utils/web3/jabber";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet";
import { PublicKey } from "@solana/web3.js";
import { JABBER_ID, MessageType } from "@bonfida/jabber";
import { encryptMessageToBuffer } from "../utils/jabber";
import { signAndSendTransactionInstructions } from "../utils/utils";
import { findProgramAddress } from "../utils/web3/program-address";
import { URL_UPLOAD } from "../utils/ipfs";
import axios from "axios";
import { IPost } from "../types";

const UploadIpfsButton = ({ receiver }: { receiver: string }) => {
  const [loading, setLoading] = useState(false);
  const connection = useConnection();
  const { wallet } = useWallet();

  const upload = async (message: Buffer) => {
    if (!wallet) return;
    try {
      setLoading(true);
      const receiverAddress = new PublicKey(receiver);
      const thread = await Thread.retrieve(
        connection,
        wallet.publicKey,
        receiverAddress
      );
      const seeds = Message.generateSeeds(
        thread.msgCount,
        wallet.publicKey,
        new PublicKey(receiver)
      );
      const [messageAccount] = await findProgramAddress(seeds, JABBER_ID);

      const encrypted = encryptMessageToBuffer(
        message,
        wallet,
        receiverAddress,
        messageAccount
      );

      const formData = new FormData();

      formData.append("file", JSON.stringify(encrypted));

      const { data }: { data: IPost } = await axios.post(URL_UPLOAD, formData);

      const hash = data.Hash;

      const instruction = await sendMessage(
        connection,
        wallet.publicKey,
        receiverAddress,
        Buffer.from(hash),
        MessageType.EncryptedImage
      );
      const tx = await signAndSendTransactionInstructions(
        connection,
        [],
        wallet,
        [instruction]
      );
      console.log(tx);
    } catch (err) {
      console.log("Upload error", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.type === "success") {
      const type = mime.getType(result.name);
      if (!type) {
        return alert("Unknown tpye");
      }
      const len = Buffer.alloc(1);
      len.writeInt8(type.length, 0);
      const prefix = Buffer.concat([len, Buffer.from(type)]);

      const base64String = await FileSystem.readAsStringAsync(result.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileBuffer = Buffer.from(base64String, "base64");

      const message = Buffer.concat([prefix, fileBuffer]);

      await upload(message);
    }
  };

  return (
    <TouchableOpacity style={styles.root} onPress={handlePickDocument}>
      <Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Entypo name="attachment" size={24} color="black" />
        )}
      </Text>
    </TouchableOpacity>
  );
};

export default UploadIpfsButton;

const styles = StyleSheet.create({
  root: {
    marginRight: 20,
  },
});
