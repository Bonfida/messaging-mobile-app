import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  Modal,
} from "react-native";
import { useBalance, useWallet } from "../utils/wallet";
import EnterSeedScreen from "./EnterSeedScreen";
import {
  abbreviateAddress,
  roundToDecimal,
  signAndSendTransactionInstructions,
} from "../utils/utils";
import { useProfile } from "../utils/jabber";
import { useNavigation } from "@react-navigation/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { makeFtxPayUrl } from "../utils/ftx-pay";
import { BioModalContent } from "../components/EditBioModal";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
import mime from "mime";
import axios from "axios";
import { URL_UPLOAD } from "../utils/ipfs";
import { Profile } from "../utils/web3/jabber";
import { useConnection } from "../utils/connection";
import { setUserProfile } from "@bonfida/jabber";
import { RenderBio } from "../components/Profile/Bio";
import { Row } from "../components/Profile/Row";
import { RenderWithIcon } from "../components/Profile/RenderWithIcon";
import { ProfileRow } from "../components/Profile/ProfileRow";

const SettingsScreen = () => {
  const { wallet, refresh: refreshWallet } = useWallet();
  const [refresh, setRefresh] = useState(false);
  const [balance, balanceLoading] = useBalance(refresh);
  const [profile, profileLoading] = useProfile(refresh);
  const navigation = useNavigation();
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const connection = useConnection();
  const [loading, setLoading] = useState(false);

  const handleOnPressDelete = async () => {
    await SecureStore.deleteItemAsync("mnemonic");
    refreshWallet();
    alert("Secret key deleted!");
  };

  if (!wallet) {
    return <EnterSeedScreen />;
  }

  useEffect(() => {
    setRefresh((prev) => !prev);
  }, [bioModalVisible]);

  const handleProfilePicture = async () => {
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

        const base64String = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileBuffer = Buffer.from(base64String, "base64");

        const message = Buffer.concat([prefix, fileBuffer]);
        const formData = new FormData();

        formData.append("file", JSON.stringify(Uint8Array.from(message)));

        const { data } = await axios.post(URL_UPLOAD, formData);

        // @ts-ignore
        const hash = data.Hash;

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

        await signAndSendTransactionInstructions(connection, [], wallet, [
          instruction,
        ]);
        setRefresh((prev) => !prev);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={balanceLoading || profileLoading}
            onRefresh={() => setRefresh((prev) => !prev)}
          />
        }
        contentContainerStyle={styles.scrollView}
      >
        <View style={{ marginTop: "10%" }}>
          {/* Profile row: domain name + profile pic */}
          <ProfileRow />
          {/* SOL address */}
          <Row
            label="SOL Address:"
            value={abbreviateAddress(wallet.publicKey, 10)}
          />
          {/* Balance */}
          <Row
            label="Balance:"
            value={
              balance ? (
                `${roundToDecimal(balance, 3)} SOL`
              ) : (
                <ActivityIndicator />
              )
            }
          />
          {/* FTX Pay */}
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(makeFtxPayUrl(wallet.publicKey.toBase58()))
            }
          >
            <Row
              label="Deposit SOL"
              value={
                <RenderWithIcon
                  text="FTX Pay"
                  icon={
                    <MaterialIcons
                      name="arrow-forward-ios"
                      size={15}
                      color="black"
                    />
                  }
                />
              }
            />
          </TouchableOpacity>
          {/* SOL per message fee */}
          {profile && (
            <TouchableOpacity onPress={() => navigation.navigate("Edit Fee")}>
              <Row
                label="SOL per message:"
                value={
                  <RenderWithIcon
                    text={
                      <>
                        {roundToDecimal(
                          profile.lamportsPerMessage.toNumber() /
                            LAMPORTS_PER_SOL,
                          3
                        )}{" "}
                        SOL
                      </>
                    }
                    icon={
                      <MaterialIcons
                        name="arrow-forward-ios"
                        size={15}
                        color="black"
                      />
                    }
                  />
                }
              />
            </TouchableOpacity>
          )}
          {/* Bio */}
          <TouchableOpacity onPress={() => setBioModalVisible(true)}>
            <Row label="Bio" value={<RenderBio refresh={refresh} />} />
          </TouchableOpacity>
          <Modal
            animationType="slide"
            transparent={false}
            visible={bioModalVisible}
          >
            <BioModalContent setVisible={setBioModalVisible} />
          </Modal>

          {/* Profile picture */}
          <TouchableOpacity onPress={handleProfilePicture}>
            <Row
              label="Profile picture"
              value={
                loading ? (
                  <ActivityIndicator />
                ) : (
                  <Ionicons
                    name="ios-camera"
                    size={24}
                    color="black"
                    style={styles.opacity}
                  />
                )
              }
            />
          </TouchableOpacity>
        </View>

        {/* Delete private key */}
        <TouchableOpacity
          onPress={handleOnPressDelete}
          style={{ marginTop: "10%" }}
        >
          <View style={styles.row}>
            <View style={styles.warningContainer}>
              <Text style={styles.redText}>Delete private key</Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safeAreaView: { height: "100%" },
  scrollView: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-start",
  },
  editButtonContainer: {
    marginBottom: 5,
    marginLeft: 20,
    marginRight: 20,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  warningButtonContainer: {
    marginTop: 5,
    elevation: 8,
    marginLeft: 20,
    marginRight: 20,
    backgroundColor: "rgb(241, 76, 76)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  profileImgContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10%",
  },
  profileImg: {
    width: 90,
    height: 90,
  },

  feeContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  feeValue: {
    marginRight: 5,
  },

  warningContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    flex: 1,
  },
  redText: {
    color: "rgb(243, 7, 9)",
    fontWeight: "bold",
  },

  opacity: {
    opacity: 0.7,
  },
  row: {
    marginTop: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
  },
});
