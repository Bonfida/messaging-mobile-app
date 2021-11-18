import React from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";
import { Circle } from "../ContactRow";
import { useGetIpfsData } from "../../utils/jabber";
import { useNavigation } from "@react-navigation/native";
import { mediaScreenProp } from "../../types";

export const RenderProfilePic = ({
  firstLetter,
  hashPic,
}: {
  firstLetter: string;
  hashPic: string | undefined;
}) => {
  const pic = useGetIpfsData(hashPic);
  const navigation = useNavigation<mediaScreenProp>();

  if (pic) {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.navigate("Media", {
            uri: `data:${pic.type};base64,${pic.media}`,
          })
        }
      >
        <Image
          source={{ uri: `data:${pic.type};base64,${pic.media}` }}
          style={styles.profilePic}
        />
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
