import React from "react";
import { StyleSheet, SafeAreaView, ImageBackground } from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";

export const ImageZoom = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Media">;
}) => {
  const { uri } = route.params;
  return (
    <SafeAreaView style={styles.wrapper}>
      <ImageBackground
        resizeMode="contain"
        style={styles.img}
        source={{ uri: uri }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  img: {
    flex: 1,
    justifyContent: "center",
  },
});
