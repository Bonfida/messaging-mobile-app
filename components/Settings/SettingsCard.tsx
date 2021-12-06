import React from "react";
import GradientCard from "../Cards/GradientCard";
import { View, StyleSheet, Text } from "react-native";
import UploadProfilePic from "./UploadProfilePic";
import { Profile } from "../../utils/web3/jabber";
import BlueTextGradient from "../TextGradients/BlueTextGradient";
import { useGetIpfsData } from "../../utils/jabber";
import { useWallet } from "../../utils/wallet.native";

const FeeAndBalance = ({ fee, balance }: { fee: number; balance: number }) => {
  return (
    <View style={styles.feeAndBalanceContainer}>
      <Text style={styles.greyText}>Balance</Text>
      <Text style={styles.pinkText}>{balance}</Text>
      <Text style={styles.greyText}>Messaging fee</Text>
      <Text style={styles.pinkText}>{fee}</Text>
    </View>
  );
};

const Top = ({
  profilePicHash,
  balance,
  fee,
}: {
  profilePicHash: string | undefined;
  balance: number;
  fee: number;
}) => {
  const pic = useGetIpfsData(profilePicHash);
  return (
    <View style={styles.topContainer}>
      <UploadProfilePic profilePic={pic} />
      <FeeAndBalance fee={fee} balance={balance} />
    </View>
  );
};

const Bottom = ({ name, address }: { name: string; address: string }) => {
  return (
    <View style={styles.bottomContainer}>
      {name !== address && (
        <BlueTextGradient
          maskStyle={styles.maskStyle}
          textStyle={styles.gradientStyle}
          text={name}
          start={{ x: 0.5, y: 0.5 }}
        />
      )}
      <Text style={styles.greyText} numberOfLines={1} ellipsizeMode="tail">
        {address}
      </Text>
    </View>
  );
};

const SettingsCard = ({
  profilePicHash,
  name,
  address,
  balance,
  fee,
}: {
  profilePicHash: string | undefined;
  name: string;
  address: string;
  balance: number;
  fee: number;
}) => {
  return (
    <GradientCard borderRadius={12} height={221} width={"100%"}>
      <View style={styles.innerContainer}>
        <Top profilePicHash={profilePicHash} balance={balance} fee={fee} />
        <Bottom name={name} address={address} />
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  pinkText: {
    color: "#B846B2",
    fontSize: 18,
    fontWeight: "700",
  },
  greyText: {
    color: "#C8CCD6",
    fontSize: 14,
    fontWeight: "400",
    textAlign: "right",
    marginLeft: 10,
  },
  feeAndBalanceContainer: {
    display: "flex",
    alignItems: "flex-end",
  },
  topContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "90%",
    marginRight: "5%",
    marginLeft: "5%",
    marginTop: 20,
  },
  gradientStyle: {
    fontSize: 26,
    textTransform: "uppercase",
    textAlign: "right",
    fontFamily: "Rota-Regular",
  },
  maskStyle: {
    height: 30,
  },
  addressText: {
    color: "#9BA3B5",
    fontSize: 12,
    fontFamily: "Rota-Regular",
  },
  innerContainer: {
    display: "flex",
    height: "100%",
    justifyContent: "space-around",
  },
  bottomContainer: {
    marginRight: "5%",
  },
});

export default SettingsCard;
