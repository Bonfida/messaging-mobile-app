import React from "react";
import GradientCard from "../Cards/GradientCard";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import UploadProfilePic from "./UploadProfilePic";
import { useGetIpfsData } from "../../utils/jabber";
import * as Clipboard from "expo-clipboard";

const FeeAndBalance = ({
  fee,
  balance,
  tipsReceived,
  tipsSent,
}: {
  fee: number;
  balance: number;
  tipsReceived: number;
  tipsSent: number;
}) => {
  return (
    <View style={styles.feeAndBalanceContainer}>
      <Text style={styles.greyText}>Balance</Text>
      <Text style={styles.whiteBoldText}>{balance}</Text>
      <Text style={styles.greyText}>Messaging fee</Text>
      <Text style={styles.whiteBoldText}>{fee}</Text>
      <Text style={styles.greyText}>Tips received/sent</Text>
      <Text style={styles.whiteBoldText}>
        {tipsReceived}/{tipsSent}
      </Text>
    </View>
  );
};

const Top = ({
  profilePicHash,
  balance,
  fee,
  tipsReceived,
  tipsSent,
}: {
  profilePicHash: string | undefined;
  balance: number;
  fee: number;
  tipsReceived: number;
  tipsSent: number;
}) => {
  const pic = useGetIpfsData(profilePicHash);
  return (
    <View style={styles.topContainer}>
      <UploadProfilePic profilePic={pic} />
      <FeeAndBalance
        fee={fee}
        balance={balance}
        tipsReceived={tipsReceived}
        tipsSent={tipsSent}
      />
    </View>
  );
};

const Bottom = ({ name, address }: { name: string; address: string }) => {
  return (
    <View style={styles.bottomContainer}>
      {name !== address && <Text style={styles.blueText}>{name}</Text>}

      <TouchableOpacity onPress={() => Clipboard.setString(address)}>
        <Text style={styles.greyText} numberOfLines={1} ellipsizeMode="tail">
          {address}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const SettingsCard = ({
  profilePicHash,
  name,
  address,
  balance,
  fee,
  tipsReceived,
  tipsSent,
}: {
  profilePicHash: string | undefined;
  name: string;
  address: string;
  balance: number;
  fee: number;
  tipsReceived: number | null | undefined;
  tipsSent: number | null | undefined;
}) => {
  return (
    <GradientCard borderRadius={12} height={221} width={"100%"}>
      <View style={styles.innerContainer}>
        <Top
          profilePicHash={profilePicHash}
          balance={balance}
          fee={fee}
          tipsReceived={tipsReceived || 0}
          tipsSent={tipsSent || 0}
        />
        <Bottom name={name} address={address} />
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  whiteBoldText: {
    color: "#F0F5FF",
    fontSize: 18,
    fontWeight: "700",
  },
  greyText: {
    color: "#F0F5FF",
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
  blueText: {
    color: "#77E3EF",
    fontSize: 26,
    textAlign: "right",
    textTransform: "uppercase",
  },
});

export default SettingsCard;
