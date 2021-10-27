import React from "react";
import { PublicKey } from "@solana/web3.js";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useDisplayName } from "../utils/name-service";
import { useNavigation } from "@react-navigation/native";
import { Line } from "./Line";
import { useProfilePic } from "../utils/jabber";

const COLORS = [
  "#e44f74",
  "#7839e9",
  "#7cb9f6",
  "#78cde6",
  "#45e9b1",
  "#0cbe1f",
  "#31a06b",
  "#30414c",
  "#c0c985",
  "#271132",
  "#48b6f4",
  "#e7c447",
];

const cache = new Map<string, string>();

export const Circle = ({ name }: { name: string }) => {
  const idx = Math.floor(Math.random() * COLORS.length);
  const cached = cache.get(name);
  const color = cached ? cached : COLORS[idx];
  if (!cached) cache.set(name, color);
  return (
    <View style={{ ...styles.circle, backgroundColor: color }}>
      <Text style={styles.circleText}>{name.toUpperCase()}</Text>
    </View>
  );
};

const MessageRow = ({ contact }: { contact: PublicKey }) => {
  const base58 = contact?.toBase58();
  const displayName = useDisplayName(base58);
  const firstLetter = displayName[0] ? displayName[0][0] : base58[0];
  const navigation = useNavigation();
  const [pic] = useProfilePic(contact);

  const handleOnPressDisplayName = () => {
    navigation.navigate("Message", { contact: base58 });
  };

  const handleOnPressProfile = () => {
    navigation.navigate("Profile", { contact: base58 });
  };

  return (
    <>
      <View style={styles.row}>
        <TouchableOpacity onPress={handleOnPressProfile}>
          {pic ? (
            <Image source={{ uri: pic }} style={styles.profilePic} />
          ) : (
            <Circle name={firstLetter} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleOnPressDisplayName}>
          <Text style={styles.nameText}>{displayName}</Text>
        </TouchableOpacity>
      </View>
      <Line width="100%" />
    </>
  );
};

export default MessageRow;

const styles = StyleSheet.create({
  row: {
    marginLeft: 10,
    marginTop: 10,
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    flexDirection: "row",
  },
  item: {
    margin: 10,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 25,
    fontWeight: "bold",
  },
  nameText: {
    fontSize: 20,
    marginLeft: 10,
  },
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
  },
});
