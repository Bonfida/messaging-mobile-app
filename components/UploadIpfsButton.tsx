import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Entypo } from "@expo/vector-icons";

const UploadIpfsButton = () => {
  return (
    <TouchableOpacity style={styles.root}>
      <Text>
        <Entypo name="attachment" size={24} color="black" />
      </Text>
    </TouchableOpacity>
  );
};

export default UploadIpfsButton;

const styles = StyleSheet.create({
  root: {
    marginRight: 20,
  },
});
