import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import GradientCard from "../Cards/GradientCard";
import BlueTextGradient from "../TextGradients/BlueTextGradient";
import { IData } from "../../utils/jabber";
import * as Clipboard from "expo-clipboard";

export const Circle = ({ name }: { name: string }) => {
  return (
    <View style={styles.circle}>
      <Text style={styles.circleText}>{name.toUpperCase()}</Text>
    </View>
  );
};

const Fee = ({ fee }: { fee: number | null }) => {
  return (
    <View style={styles.feeContainer}>
      <Text style={styles.fee}>Fee/msg</Text>
      <Text style={styles.pinkText}>{fee || 0} SOL</Text>
    </View>
  );
};

const BottomCard = ({
  domain,
  address,
}: {
  domain: string;
  address: string;
}) => {
  return (
    <View style={styles.bottomCard}>
      <View>
        <BlueTextGradient
          textStyle={styles.gradientStyle}
          maskStyle={styles.maskStyle}
          text={domain}
          start={{ x: 0.5, y: 0.5 }}
        />
      </View>
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
}: {
  domain: string;
  address: string;
  pic: IData | null;
  feeMsg: number;
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
            <Circle name={domain.slice(0, 2)} />
          )}
          <Fee fee={feeMsg} />
        </View>
        <BottomCard domain={domain} address={address} />
      </View>
    </GradientCard>
  );
};

export default ProfileCard;

const styles = StyleSheet.create({
  pinkText: {
    fontSize: 16,
    color: "#B846B2",
    fontWeight: "bold",
    textAlign: "right",
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
    color: "#C8CCD6",
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
    color: "#9BA3B5",
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
});
