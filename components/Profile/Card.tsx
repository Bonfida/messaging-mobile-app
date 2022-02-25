import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import GradientCard from "../Cards/GradientCard";
import { IData } from "../../utils/jabber";
import * as Clipboard from "expo-clipboard";

export const Circle = ({ name }: { name: string }) => {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>{name.toUpperCase()}</Text>
    </View>
  );
};

const FeeAndTips = ({
  fee,
  tips,
}: {
  fee: number | null;
  tips: number | null | undefined;
}) => {
  return (
    <View style={styles.feeContainer}>
      <Text style={styles.fee}>Fee/msg</Text>
      <Text style={styles.whiteBoldText}>{fee || 0} SOL</Text>
      <Text style={styles.fee}>Tips received</Text>
      <Text style={styles.whiteBoldText}>{tips || 0}</Text>
    </View>
  );
};

const BottomCard = ({
  domain,
  address,
}: {
  domain: string | null;
  address: string;
}) => {
  return (
    <View style={styles.bottomCard}>
      {domain && (
        <View>
          <Text style={styles.blueText}>{domain}</Text>
        </View>
      )}
      <View>
        <TouchableOpacity onPress={() => Clipboard.setString(address)}>
          <Text style={styles.addressText}>{address}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProfileCard = ({
  domain,
  address,
  pic,
  feeMsg,
  tips,
}: {
  domain: string | null;
  address: string;
  pic: IData | null;
  feeMsg: number;
  tips: number | null | undefined;
}) => {
  return (
    <GradientCard borderRadius={12} width="100%" height={211}>
      <View style={styles.innerContainer}>
        <View style={styles.topContainer}>
          {pic ? (
            <Image
              style={styles.profilePic}
              source={{ uri: `data:${pic.type};base64,${pic.media}` }}
            />
          ) : (
            <Circle name={domain ? domain.slice(0, 2) : address.slice(0, 2)} />
          )}
          <FeeAndTips fee={feeMsg} tips={tips} />
        </View>
        <BottomCard domain={domain} address={address} />
      </View>
    </GradientCard>
  );
};

export default ProfileCard;

const styles = StyleSheet.create({
  whiteBoldText: {
    color: "#F0F5FF",
    fontSize: 18,
    fontWeight: "700",
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C7CFF",
  },
  circleText: {
    fontSize: 25,
    color: "#0F0F11",
  },
  fee: {
    fontSize: 14,
    color: "#F0F5FF",
  },
  feeContainer: {
    width: 100,
    height: 55,
    display: "flex",
    alignItems: "flex-end",
  },
  topContainer: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexDirection: "row",
    width: "90%",
    marginLeft: "5%",
    marginRight: "5%",
    marginTop: 20,
  },
  bottomCard: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  addressText: {
    color: "#F0F5FF",
    fontSize: 12,
    fontFamily: "Rota-Regular",
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
  innerContainer: {
    height: "100%",
    position: "relative",
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
  },
  blueText: {
    color: "#77E3EF",
    fontSize: 26,
    textAlign: "right",
    textTransform: "uppercase",
  },
});
