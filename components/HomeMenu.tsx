import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import NewChatBottomSheet from "./NewChatBottomSheet";
import { profileScreenProp } from "../types";

const HomeMenu = () => {
  const navigation = useNavigation<profileScreenProp>();
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ backgroundColor: "rgba(0,0,0,0)" }}>
      <LinearGradient
        colors={[
          "#0F0F11",
          "rgba(19, 30, 48, 0.75)",
          "rgba(167, 180, 204, 0.25)",
          "#0F0F11",
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          width: 224,
          height: 80,
          borderRadius: 40,
          padding: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <View style={styles.root}>
          <TouchableOpacity onPress={() => console.log("TODO")}>
            <Image
              style={styles.img}
              source={require("../assets/menu/camera.png")}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVisible(true)}>
            <Image
              style={styles.img}
              source={require("../assets/menu/message.png")}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Image
              style={styles.img}
              source={require("../assets/menu/gear.png")}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <NewChatBottomSheet visible={visible} setVisible={setVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#0F0F11",
    borderRadius: 40,
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  img: {
    width: 28,
    height: 28,
  },
});

export default HomeMenu;
