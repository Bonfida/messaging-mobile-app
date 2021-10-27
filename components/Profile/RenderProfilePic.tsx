import React from "react";
import { Image, StyleSheet } from "react-native";
import { Circle } from "../ContactRow";
import { useProfilePic } from "../../utils/jabber";
import { PublicKey } from "@solana/web3.js";

export const RenderProfilePic = ({
  firstLetter,
  address,
}: {
  firstLetter: string;
  address: PublicKey;
}) => {
  const [pic] = useProfilePic(address);
  if (!!pic) {
    return <Image source={{ uri: pic }} style={styles.profilePic} />;
  }
  return <Circle name={firstLetter} />;
};

const styles = StyleSheet.create({
  profilePic: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
  },
});
