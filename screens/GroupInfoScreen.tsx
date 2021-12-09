import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
} from "react-native";
import { useGetIpfsData, useGroupData, useGroupMembers } from "../utils/jabber";
import { RouteProp } from "@react-navigation/native";
import { Row } from "../components/Profile/Row";
import { RootStackParamList } from "../App";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { abbreviateAddress } from "../utils/utils.native";
import { MaterialIcons } from "@expo/vector-icons";
import { useWallet } from "../utils/wallet.native";
import { useConnection } from "../utils/connection";
import { editGroupThread, GroupThread } from "../utils/web3/jabber";
import { Feather, Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { editAdminScreenProp, messageScreenProp } from "../types";
import { balanceWarning } from "../components/BalanceWarning";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import mime from "mime";
import axios from "axios";
import { encode } from "../utils/utils.native";
import { URL_UPLOAD } from "../utils/ipfs";
import { IPost } from "../types";
import { isWeb } from "../utils/utils";
import EditFeeBottomSheet from "../components/EditFeeBottomSheet";
import GroupMembersBottomSheet from "../components/GroupMembersBottomSheet";
import ManageAdminBottomSheet from "../components/ManageAdminsBottomSheet";

const BlueArrow = () => {
  return <MaterialIcons name="arrow-forward-ios" size={15} color="#12192E" />;
};

const GroupInfoScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Group Info">;
}) => {
  const [loading, setLoading] = useState(false);
  const { group } = route.params;
  const groupData = useGroupData(group);
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();
  const navigation = useNavigation<editAdminScreenProp | messageScreenProp>();
  const [copied, setCopied] = useState(false);
  const pic = useGetIpfsData(groupData?.groupPicHash);
  const isAdmin = wallet?.publicKey.toBase58() === groupData?.owner.toBase58();
  const [groupMembers] = useGroupMembers(group, groupData);
  const [feeVisible, setFeeVisible] = useState(false);
  const [membersVisible, setMembersVisible] = useState(false);
  const [manageAdminVisible, setManageAdminVisible] = useState(false);

  const handleOnPressEnableMedia = async () => {
    if (!wallet) return;
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    try {
      setLoading(true);
      const {
        groupName,
        owner,
        destinationWallet,
        lamportsPerMessage,
        mediaEnabled,
        adminOnly,
        groupPicHash,
      } = await GroupThread.retrieveFromKey(connection, new PublicKey(group));

      const instruction = await editGroupThread(
        groupName,
        owner,
        destinationWallet,
        lamportsPerMessage,
        !mediaEnabled,
        adminOnly,
        groupPicHash
      );

      const tx = await sendTransaction({
        connection,
        instruction: [instruction],
        wallet,
        signers: [],
      });
      console.log(tx);
    } catch (err) {
      isWeb
        ? alert(`Error ${err}`)
        : Alert.alert("Error", `Error sending transaction ${err}`);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnPressEnableAdminOnly = async () => {
    if (!wallet) return;
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    try {
      setLoading(true);
      const {
        groupName,
        owner,
        destinationWallet,
        lamportsPerMessage,
        mediaEnabled,
        adminOnly,
        groupPicHash,
      } = await GroupThread.retrieveFromKey(connection, new PublicKey(group));

      const instruction = await editGroupThread(
        groupName,
        owner,
        destinationWallet,
        lamportsPerMessage,
        mediaEnabled,
        !adminOnly,
        groupPicHash
      );

      const tx = await sendTransaction({
        connection,
        instruction: [instruction],
        wallet,
        signers: [],
      });
      console.log(tx);
    } catch (err) {
      isWeb
        ? alert(`Error ${err}`)
        : Alert.alert("Error", `Error sending transaction ${err}`);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnPressCopy = () => {
    Clipboard.setString(group);
    setCopied(true);
  };

  const handleOnPressGroupPicture = async () => {
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

        const {
          groupName,
          owner,
          destinationWallet,
          lamportsPerMessage,
          mediaEnabled,
          adminOnly,
        } = await GroupThread.retrieveFromKey(connection, new PublicKey(group));

        const instruction = await editGroupThread(
          groupName,
          owner,
          destinationWallet,
          lamportsPerMessage,
          mediaEnabled,
          adminOnly,
          hash
        );

        const tx = await sendTransaction({
          connection,
          wallet,
          instruction: [instruction],
          signers: [],
        });
        console.log(tx);
      } catch (err) {
        isWeb
          ? alert(`Error ${err}`)
          : Alert.alert("Error", `Error sending transaction ${err}`);
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView>
        {/* Group pic */}
        <View style={styles.groupPic}>
          {pic ? (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("Media", {
                  uri: `data:${pic.type};base64,${pic.media}`,
                })
              }
            >
              <Image
                source={{ uri: `data:${pic.type};base64,${pic.media}` }}
                style={styles.pic}
              />
            </TouchableOpacity>
          ) : (
            <Image
              source={require("../assets/group-fida.png")}
              style={styles.pic}
            />
          )}
        </View>
        {/* Group name */}
        <Row label="Group name" value={groupData?.groupName} />
        {/* Group address */}
        <TouchableOpacity onPress={handleOnPressCopy}>
          <Row
            label="Group address"
            value={
              <>
                {abbreviateAddress(group)}{" "}
                {copied && <Feather name="check" size={15} color="green" />}
              </>
            }
          />
        </TouchableOpacity>

        {/* Group members */}
        <TouchableOpacity onPress={() => setMembersVisible(true)}>
          <Row
            label="Group members"
            value={
              <MaterialIcons name="arrow-forward-ios" size={15} color="black" />
            }
          />
          <GroupMembersBottomSheet
            visible={membersVisible}
            setVisible={setMembersVisible}
            members={groupMembers}
          />
        </TouchableOpacity>

        {/* SOL fee */}
        <Row
          label="SOL Fee"
          value={
            `${
              groupData?.lamportsPerMessage
                ? groupData?.lamportsPerMessage.toNumber() / LAMPORTS_PER_SOL
                : 0
            }` + " SOL"
          }
        />
        {/* Destination wallet */}
        <Row
          label="Destination wallet"
          value={abbreviateAddress(groupData?.destinationWallet.toBase58())}
        />
        {/* Group owner */}
        <Row
          label="Owner"
          value={abbreviateAddress(groupData?.owner.toBase58())}
        />
        {/* Admin only */}
        <Row label="Admin only" value={groupData?.adminOnly ? "Yes" : "No"} />
        {/* Media enabled */}
        <Row
          label="Media enabled"
          value={groupData?.mediaEnabled ? "Yes" : "No"}
        />

        {isAdmin && (
          <>
            <TouchableOpacity onPress={handleOnPressGroupPicture}>
              <Row
                label="Group picture"
                value={loading ? <ActivityIndicator /> : <BlueArrow />}
              />
            </TouchableOpacity>

            <TouchableOpacity
              // onPress={() =>
              //   navigation.navigate("Edit Admins", {
              //     group: group,
              //   })
              // }
              onPress={() => setManageAdminVisible(true)}
            >
              <Row label="Manage admins" value={<BlueArrow />} />
              <ManageAdminBottomSheet
                visible={manageAdminVisible}
                setVisible={setManageAdminVisible}
                group={group}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFeeVisible(true)}>
              <Row label="Edit Fee" value={<BlueArrow />} />
              <EditFeeBottomSheet
                visible={feeVisible}
                setVisible={setFeeVisible}
                groupAddress={group}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOnPressEnableMedia}>
              <Row
                label="Disable/Enable media"
                value={
                  loading ? (
                    <ActivityIndicator />
                  ) : groupData?.mediaEnabled ? (
                    <Feather name="check" size={15} color="green" />
                  ) : (
                    <Entypo name="cross" size={24} color="red" />
                  )
                }
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOnPressEnableAdminOnly}>
              <Row
                label="Disable/Enable admins only"
                value={
                  loading ? (
                    <ActivityIndicator />
                  ) : groupData?.adminOnly ? (
                    <Feather name="check" size={15} color="green" />
                  ) : (
                    <Entypo name="cross" size={24} color="red" />
                  )
                }
              />
            </TouchableOpacity>
          </>
        )}
        <View>
          {/* Encryption warning */}
          <View style={styles.encryptionWarning}>
            <Text>⚠️ Unlike DMs, group messages are unencrypted</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default GroupInfoScreen;

const styles = StyleSheet.create({
  safeAreaView: {
    height: "100%",
  },
  groupPic: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "5%",
    marginTop: "5%",
  },
  opacity: {
    opacity: 0.7,
  },
  pic: {
    width: 90,
    height: 90,
    borderRadius: 90 / 2,
  },
  encryptionWarning: {
    display: "flex",
    alignItems: "center",
    marginTop: 20,
  },
});
