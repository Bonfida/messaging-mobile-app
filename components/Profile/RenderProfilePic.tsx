import React from "react";
import { Image, StyleSheet } from "react-native";
import { Circle } from "../ContactRow";
import { useWallet } from "../../utils/wallet";
import { useProfilePic } from "../../utils/jabber";

export const RenderProfilePic = ({ firstLetter }: { firstLetter: string }) => {
  const { wallet } = useWallet();
  const [pic] = useProfilePic(wallet!.publicKey);
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
