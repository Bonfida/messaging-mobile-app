import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Circle } from "../ContactRow";
import { useProfilePic } from "../../utils/jabber";
import { PublicKey } from "@solana/web3.js";
import { useNavigation } from "@react-navigation/native";
import { mediaScreenProp } from "../../types";

export const RenderProfilePic = ({
  firstLetter,
  address,
}: {
  firstLetter: string;
  address: PublicKey;
}) => {
  const pic = useProfilePic(address);
  const navigation = useNavigation<mediaScreenProp>();
  if (pic) {
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Media", { uri: pic })}
      >
        <Image source={{ uri: pic }} style={styles.profilePic} />
      </TouchableOpacity>
    );
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
