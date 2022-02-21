import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
} from "react-native";
import { useWallet, useBalanceWs } from "../utils/wallet.native";
import EnterSeedScreen from "./EnterSeedScreen";
import { roundToDecimal } from "../utils/utils.native";
import { useProfileWs } from "../utils/jabber";
import { useNavigation } from "@react-navigation/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MaterialIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { makeFtxPayUrl } from "../utils/ftx-pay";
import { Row } from "../components/Profile/Row";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { editFeeScreenProp, IStep } from "../types";
import { useUserHasDomainOrTwitter } from "../utils/name-service";
import HelpsUrls from "../utils/HelpUrls";
import ConfirmDeleteBottomSheet from "../components/ConfirmDeleteBottomSheet";
import { LoadingScreen } from "../components/LoadingScreen";
import { useDisplayName } from "../utils/name-service";
import GlobalStyle from "../Style";
import SettingsCard from "../components/Settings/SettingsCard";
import { BlueButtonWhiteBg } from "../components/Buttons/BlueGradient";
import EditFeeBottomSheet from "../components/EditFeeBottomSheet";
import EditBioBottomSheet from "../components/EditBioBottomSheet";
import ChangeRpcBottomSheet from "../components/ChangeRpcBottomSheet";

const BlueArrow = () => {
  return <MaterialIcons name="arrow-forward-ios" size={15} color="#12192E" />;
};

const SettingsScreen = () => {
  const {
    wallet,
    refresh: refreshWallet,
    walletLoaded,
    created,
    setCreated,
    step,
    setStep,
  } = useWallet();
  const balance = useBalanceWs(wallet?.publicKey);
  const profile = useProfileWs(wallet?.publicKey);
  const navigation = useNavigation<editFeeScreenProp>();
  const [copied, setCopied] = useState(false);
  const [domainOrTwitter] = useUserHasDomainOrTwitter();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [displayName] = useDisplayName(wallet?.publicKey?.toBase58());
  const [feeVisible, setFeeVisible] = useState(false);
  const [bioVisible, setBioVisible] = useState(false);
  const [rpcVisible, setRpcVisible] = useState(false);

  const handleOnPressDelete = async () => {
    await SecureStore.deleteItemAsync("mnemonic");
    await AsyncStorage.clear();
    await setCreated(false);
    setStep(IStep.Welcome);
    refreshWallet();
    alert("Secret key deleted!");
  };

  const handleOnPressClearCache = async () => {
    await AsyncStorage.clear();
    alert("Cache cleared");
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Let's chat on Jabber! It's a fast, simple, encrypted and decentralized messaging app built on Solana. My address is ${wallet?.publicKey.toBase58()}`,
      });
    } catch (error) {
      // @ts-ignore
      alert(error.message);
    }
  };

  // Hacky
  // The storage size used it 100 for the name and an IPFS hash is 64 max.
  // Using the rest to store the favourite domain name of the user i.e
  // the domain name he wants other people to see.
  const favoriteDisplayName = profile?.displayDomainName;
  const profilePicHash = profile?.pictureHash;

  useEffect(() => {
    if (!copied) return;
    const timer = setInterval(() => {
      setCopied(false);
    }, 2_000);
    return () => clearInterval(timer);
  }, [copied]);

  if (!wallet && !walletLoaded) {
    return <LoadingScreen />;
  }

  if (!wallet || !created) {
    return <EnterSeedScreen step={step} setStep={setStep} />;
  }

  const nameToDisplay = favoriteDisplayName
    ? favoriteDisplayName
    : displayName
    ? displayName[0]
    : wallet.publicKey.toBase58();

  return (
    <SafeAreaView style={GlobalStyle.container}>
      <ScrollView style={styles.scrollView}>
        <SettingsCard
          profilePicHash={profilePicHash}
          address={wallet.publicKey.toBase58()}
          name={nameToDisplay}
          balance={roundToDecimal(balance || 0, 3) as number}
          fee={
            profile
              ? (roundToDecimal(
                  profile?.lamportsPerMessage?.toNumber() / LAMPORTS_PER_SOL,
                  3
                ) as number)
              : 0
          }
        />
        <View style={{ marginTop: "10%" }}>
          {/* Display domain name */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Select Display Domain", {
                selectedDomain: favoriteDisplayName,
              })
            }
          >
            <Row label="Display domain name" value={<BlueArrow />} />
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity onPress={() => navigation.navigate("Gallery")}>
            <Row label="Gallery" value={<BlueArrow />} />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity onPress={onShare}>
            <Row label="Share" value={<BlueArrow />} />
          </TouchableOpacity>

          {/* SOL per message fee */}
          <TouchableOpacity onPress={() => setFeeVisible(true)}>
            <Row label="Messaging fee" value={<BlueArrow />} />
            <EditFeeBottomSheet
              visible={feeVisible}
              setVisible={setFeeVisible}
            />
          </TouchableOpacity>

          {/* Bio */}
          <TouchableOpacity onPress={() => setBioVisible(true)}>
            <Row label="Bio" value={<BlueArrow />} />
          </TouchableOpacity>
          <EditBioBottomSheet
            currentBio={profile?.bio}
            visible={bioVisible}
            setVisible={setBioVisible}
          />

          {/* Register Twitter handle if does not have one */}
          {!domainOrTwitter?.hasTwitter && (
            <TouchableOpacity
              onPress={() => Linking.openURL(HelpsUrls.verifyTwitter)}
            >
              <Row label="Twitter handle registration" value={<BlueArrow />} />
            </TouchableOpacity>
          )}

          {/* FTX Pay */}
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(makeFtxPayUrl(wallet.publicKey.toBase58()))
            }
          >
            <Row label="Deposit SOL via FTX Pay" value={<BlueArrow />} />
          </TouchableOpacity>

          {/* Buy domain  */}
          <TouchableOpacity
            onPress={() => Linking.openURL(HelpsUrls.buyDomain)}
          >
            <Row label="Buy domain" value={<BlueArrow />} />
          </TouchableOpacity>

          {/* Archive */}
          <TouchableOpacity onPress={() => navigation.navigate("Archived")}>
            <Row label="Archived chats" value={<BlueArrow />} />
          </TouchableOpacity>
        </View>

        {/* Export seed */}
        <TouchableOpacity onPress={() => navigation.navigate("Export Seeds")}>
          <Row label="Export seed" value={<BlueArrow />} />
        </TouchableOpacity>

        {/* About the app */}
        <TouchableOpacity
          onPress={() => navigation.navigate("App Information")}
        >
          <Row label="About the app" value={<BlueArrow />} />
        </TouchableOpacity>

        {/* Change RPC node */}
        <TouchableOpacity onPress={() => setRpcVisible(true)}>
          <Row label="Change RPC endpoint" value={<BlueArrow />} />
          <ChangeRpcBottomSheet
            visible={rpcVisible}
            setVisible={setRpcVisible}
          />
        </TouchableOpacity>
        <View style={styles.buttonContainer}>
          {/* Clear cache */}
          <BlueButtonWhiteBg
            width={205}
            height={56}
            borderRadius={28}
            onPress={handleOnPressClearCache}
          >
            <Text style={styles.clearCacheText}>Clear cache</Text>
          </BlueButtonWhiteBg>

          {/* Delete private key */}
          <TouchableOpacity
            onPress={() => setConfirmVisible(true)}
            style={styles.deletePrivateKeyButton}
          >
            <Text style={styles.redText}>Delete private key</Text>

            <ConfirmDeleteBottomSheet
              visible={confirmVisible}
              setVisible={setConfirmVisible}
              deleteFn={handleOnPressDelete}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  safeAreaView: {
    height: "100%",
  },
  scrollView: {
    marginTop: "5%",
    width: "90%",
    marginRight: "5%",
    marginLeft: "5%",
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
    fontSize: 15,
    fontWeight: "500",
    color: "#EB5252",
  },
  opacity: {
    opacity: 0.7,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
  },
  clearCacheText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#60C0CB",
  },
  clearCacheButton: {
    width: 205,
    height: 56,
    borderRadius: 28,
    borderColor: "#FFFFFF",
    borderWidth: 2,
    color: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    margin: 12,
  },
  deletePrivateKeyButton: {
    width: 205,
    height: 56,
    borderRadius: 28,
    borderColor: "#EB5252",
    borderWidth: 2,
    color: "#EB5252",
    justifyContent: "center",
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
    margin: 12,
  },
  buttonContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});
