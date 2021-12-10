import React, { useState } from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import NewChatBottomSheet from "./NewChatBottomSheet";
import { profileScreenProp } from "../types";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const HomeMenu = () => {
  const navigation = useNavigation<profileScreenProp>();
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.container}>
      <View
        style={{
          width: 170,
          height: 70,
          borderRadius: 40,
          padding: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <View style={styles.root}>
          <TouchableOpacity onPress={() => setVisible(true)}>
            <MaterialCommunityIcons
              name="message-plus-outline"
              size={26}
              color="#60C0CB"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <FontAwesome name="gear" size={26} color="#60C0CB" />
          </TouchableOpacity>
        </View>
      </View>
      <NewChatBottomSheet visible={visible} setVisible={setVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#F0F5FF",
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
  container: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
    marginBottom: 20,
  },
});

export default HomeMenu;
