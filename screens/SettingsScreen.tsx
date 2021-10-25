import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useBalance, useWallet } from "../utils/wallet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EnterSeedScreen from "./EnterSeedScreen";
import { abbreviateAddress, roundToDecimal } from "../utils/utils";
import { useProfile } from "../utils/jabber";
import { useNavigation } from "@react-navigation/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { MaterialIcons } from "@expo/vector-icons";
import { useDisplayName } from "../utils/name-service";
import { Circle } from "../components/ContactRow";
import * as SecureStore from "expo-secure-store";

const Row = ({
  label,
  value,
}: {
  label?: React.ReactNode;
  value?: React.ReactNode;
}) => {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const FeeView = ({ balance }: { balance: number }) => {
  return (
    <View style={styles.feeContainer}>
      <Text style={styles.feeValue}>
        {roundToDecimal(balance / LAMPORTS_PER_SOL, 3)} SOL
      </Text>
      <MaterialIcons name="arrow-forward-ios" size={15} color="black" />
    </View>
  );
};

const ProfileRow = () => {
  const { wallet } = useWallet();
  const [displayName] = useDisplayName(wallet!.publicKey.toBase58());
  const firstLetter =
    displayName && displayName[0]
      ? displayName[0][0].toLocaleUpperCase()
      : wallet!.publicKey.toBase58()[0].toUpperCase();

  if (!displayName) {
    return (
      <View style={styles.profileRow}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.profileRow}>
      <Circle name={firstLetter} />
      <Text style={styles.accountName}>
        {firstLetter + displayName?.slice(1)}
      </Text>
    </View>
  );
};

const SettingsScreen = () => {
  const { wallet, refresh: refreshWallet } = useWallet();
  const [refresh, setRefresh] = useState(false);
  const [balance, balanceLoading] = useBalance(refresh);
  const [profile, profileLoading] = useProfile(refresh);
  const navigation = useNavigation();

  const handleOnPressDelete = async () => {
    await SecureStore.deleteItemAsync("mnemonic");
    refreshWallet();
    alert("Secret key deleted!");
  };

  if (!wallet) {
    return <EnterSeedScreen />;
  }

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
          <ProfileRow />
          <Row
            label="SOL Address:"
            value={abbreviateAddress(wallet.publicKey, 10)}
          />
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
          <TouchableOpacity onPress={() => navigation.navigate("Edit Fee")}>
            {profile && (
              <Row
                label="SOL per message:"
                value={
                  <FeeView balance={profile.lamportsPerMessage.toNumber()} />
                }
              />
            )}
          </TouchableOpacity>
        </View>
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
  row: {
    marginTop: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    backgroundColor: "white",
    padding: 15,
  },
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
  label: {
    fontWeight: "bold",
  },
  value: {
    opacity: 0.7,
  },
  feeContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  feeValue: {
    marginRight: 5,
  },
  accountName: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
  },
  profileRow: {
    flexDirection: "row",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10%",
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
});
