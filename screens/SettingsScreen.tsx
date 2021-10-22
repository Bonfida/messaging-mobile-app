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
  Image,
} from "react-native";
import { useBalance, useWallet } from "../utils/wallet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EnterSeedScreen from "./EnterSeedScreen";
import { abbreviateAddress, roundToDecimal } from "../utils/utils";
import { useProfile } from "../utils/jabber";
import { useNavigation } from "@react-navigation/core";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const Row = ({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) => {
  return (
    <View style={styles.row}>
      <Text>{label}</Text>
      <Text>{value}</Text>
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
    await AsyncStorage.removeItem("mnemonic");
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
          <View style={styles.profileImgContainer}>
            <Image
              style={styles.profileImg}
              source={require("../assets/profile.png")}
            />
          </View>
          <Row
            label="SOL Address:"
            value={abbreviateAddress(wallet.publicKey)}
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
                value={`${roundToDecimal(
                  profile?.lamportsPerMessage.toNumber() / LAMPORTS_PER_SOL,
                  3
                )} SOL`}
              />
            )}
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity
            style={styles.editButtonContainer}
            onPress={() => navigation.navigate("Edit Fee")}
          >
            <Text style={styles.buttonText}>Edit message fee</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.warningButtonContainer}
            onPress={handleOnPressDelete}
          >
            <Text style={styles.buttonText}>Delete private key</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  row: {
    marginLeft: 10,
    marginRight: 10,
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  safeAreaView: { height: "100%" },
  scrollView: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
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
});
