import React from "react";
import { View, Text, StyleSheet } from "react-native";

export const RenderWithIcon = ({
  text,
  icon,
}: {
  text: React.ReactNode;
  icon: React.ReactNode;
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.value}>{text}</Text>
      {icon}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
  },
  value: {
    marginRight: 5,
  },
});
