import React, { useState } from "react";
import {
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Image,
} from "react-native";
import { useWallet } from "../utils/wallet";
import { useBalanceWs } from "../utils/wallet.native";
import EnterSeedScreen from "./EnterSeedScreen";
import {
  abbreviateAddress,
  roundToDecimal,
  encode,
} from "../utils/utils.native";
import { useProfileWs } from "../utils/jabber";
import { useNavigation } from "@react-navigation/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MaterialIcons } from "@expo/vector-icons";
import { makeFtxPayUrl } from "../utils/ftx-pay";
import { BioModalContent } from "../components/EditBioModal";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Buffer } from "buffer";
import mime from "mime";
import axios from "axios";
import { URL_UPLOAD } from "../utils/ipfs";
import { Profile } from "../utils/web3/jabber";
import { useConnection } from "../utils/connection";
import { setUserProfile, createProfile } from "@bonfida/jabber";
import { RenderBio } from "../components/Profile/Bio";
import { Row } from "../components/Profile/Row";
import { RenderWithIcon } from "../components/Profile/RenderWithIcon";
import { ProfileRow } from "../components/Profile/ProfileRow";
import { editFeeScreenProp, IPost } from "../types";
import * as Clipboard from "expo-clipboard";
import { Feather } from "@expo/vector-icons";
import {
  useDisplayName,
  useUserHasDomainOrTwitter,
} from "../utils/name-service";
import { AntDesign } from "@expo/vector-icons";
import HelpsUrls from "../utils/HelpUrls";
import Modal from "../components/Modal";
import { balanceWarning } from "../components/BalanceWarning";

const SettingsScreen = () => {
  const { wallet, sendTransaction, hasSol } = useWallet();
  const balance = useBalanceWs(wallet?.publicKey);
  const profile = useProfileWs(wallet?.publicKey);
  const navigation = useNavigation<editFeeScreenProp>();
  const [bioModalVisible, setBioModalVisible] = useState(false);
  const connection = useConnection();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [domainOrTwitter] = useUserHasDomainOrTwitter();
  const [displayName] = useDisplayName(wallet.publicKey.toBase58());

  const favoriteDisplayName = profile?.name?.split(":fdn:")[1];
  const profilePicHash = profile?.name?.split(":fdn:")[0];

  const copyAddress = () => {
    if (!wallet) return;
    Clipboard.setString(wallet?.publicKey?.toBase58());
    setCopied(true);
  };

  if (!wallet) {
    // return <EnterSeedScreen />;
    return null;
  }

  const handleProfilePicture = async () => {
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

        const base64String = correctUri.split("base64")[1];

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
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={{ marginTop: "10%" }}>
          {/* Profile row: domain name + profile pic */}
          <ProfileRow
            name={
              favoriteDisplayName
                ? favoriteDisplayName
                : displayName
                ? displayName[0]
                : undefined
            }
            hashPic={profilePicHash}
          />

          {/* SOL address */}
          <TouchableOpacity onPress={copyAddress}>
            <Row
              label="SOL Address:"
              value={
                <>
                  {abbreviateAddress(wallet?.publicKey, 10)}{" "}
                  {copied && <Feather name="check" size={15} color="green" />}
                </>
              }
            />
          </TouchableOpacity>

          {/* Balance */}
          <Row
            label="Balance:"
            value={`${roundToDecimal(balance || 0, 3)} SOL`}
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

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Edit Fee", { groupKey: undefined })
            }
          >
            <Row
              label="SOL per message:"
              value={
                <RenderWithIcon
                  text={
                    <>
                      {profile &&
                        roundToDecimal(
                          profile.lamportsPerMessage.toNumber() /
                            LAMPORTS_PER_SOL,
                          3
                        )}
                      {!profile && <>0</>} SOL
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

          {/* Bio */}
          <TouchableOpacity onPress={() => setBioModalVisible(true)}>
            <Row label="Bio" value={<RenderBio profile={profile} />} />
          </TouchableOpacity>
          {bioModalVisible && (
            <Modal
              animationType="slide"
              transparent={false}
              visible={bioModalVisible}
            >
              <BioModalContent setVisible={setBioModalVisible} />
            </Modal>
          )}

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
                    size={18}
                    color="black"
                    style={styles.opacity}
                  />
                )
              }
            />
          </TouchableOpacity>

          {/* Buy domain  */}

          <TouchableOpacity
            onPress={() => Linking.openURL(HelpsUrls.buyDomain)}
          >
            <Row
              label="Buy domain"
              value={
                <Image
                  source={require("../assets/solana-sol-logo.png")}
                  style={{ width: 18, height: 18 }}
                />
              }
            />
          </TouchableOpacity>

          {/* Register Twitter handle if does not have one */}
          {!domainOrTwitter?.hasTwitter && (
            <TouchableOpacity
              onPress={() => Linking.openURL(HelpsUrls.verifyTwitter)}
            >
              <Row
                label="Register Twitter handle"
                value={<AntDesign name="twitter" size={18} color="black" />}
              />
            </TouchableOpacity>
          )}

          {/* Archive */}
          <TouchableOpacity onPress={() => navigation.navigate("Archived")}>
            <Row
              label="Archived"
              value={
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={15}
                  color="black"
                />
              }
            />
          </TouchableOpacity>

          {/* About the app */}
          <TouchableOpacity
            onPress={() => navigation.navigate("App Information")}
          >
            <Row
              label="About the app"
              value={
                <MaterialIcons
                  name="arrow-forward-ios"
                  size={15}
                  color="black"
                />
              }
            />
          </TouchableOpacity>
        </View>
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
