import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { IData } from "../../utils/jabber";
import { useWallet } from "../../utils/wallet.native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { balanceWarning } from "../BalanceWarning";
import axios from "axios";
import { URL_UPLOAD } from "../../utils/ipfs";
import { encode } from "../../utils/utils.native";
import mime from "mime";
import { IPost } from "../../types";
import { Profile } from "../../utils/web3/jabber";
import { setUserProfile, createProfile } from "@bonfida/jabber";
import { useConnection } from "../../utils/connection";

const Circle = () => {
  return (
    <View style={styles.circle}>
      <Image source={require("../../assets/upload-profile-pic.png")} />
    </View>
  );
};

const UploadProfilePic = ({
  profilePic,
}: {
  profilePic: IData | null | undefined;
}) => {
  const [loading, setLoading] = useState(false);
  const { hasSol, wallet, sendTransaction } = useWallet();
  const connection = useConnection();

  const handleProfilePicture = async () => {
    if (!wallet) return;
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.type === "success") {
      const type = mime.getType(result.name);
      if (!type) {
        return alert("Unknown tpye");
      }

      try {
        setLoading(true);
        const len = Buffer.alloc(1);
        len.writeInt8(type.length, 0);

        const prefix = Buffer.concat([len, Buffer.from(type)]);

        const correctUri = encode(result.uri);

        const base64String = await FileSystem.readAsStringAsync(correctUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileBuffer = Buffer.from(base64String, "base64");

        const message = Buffer.concat([prefix, fileBuffer]);
        const formData = new FormData();

        formData.append("file", JSON.stringify(Uint8Array.from(message)));

        const { data }: { data: IPost } = await axios.post(
          URL_UPLOAD,
          formData
        );

        const hash = data.Hash;

        // Check if profile exists
        try {
          const currentProfile = await Profile.retrieve(
            connection,
            wallet.publicKey
          );
          const instruction = await setUserProfile(
            wallet.publicKey,
            hash,
            currentProfile.bio,
            currentProfile.lamportsPerMessage.toNumber()
          );
          await sendTransaction({
            connection,
            signers: [],
            wallet,
            instruction: [instruction],
          });
        } catch {
          const createInstruction = await createProfile(
            wallet.publicKey,
            hash,
            "",
            0
          );
          await sendTransaction({
            connection,
            signers: [],
            wallet,
            instruction: [createInstruction],
          });
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity onPress={handleProfilePicture}>
      {loading ? (
        <ActivityIndicator />
      ) : profilePic ? (
        <Image
          style={styles.profilePic}
          source={{ uri: `data:${profilePic.type};base64,${profilePic.media}` }}
        />
      ) : (
        <Circle />
      )}
    </TouchableOpacity>
  );
};

export default UploadProfilePic;

const styles = StyleSheet.create({
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgb(37, 38, 75)",
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
  },
});
