import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { RootStackParamList } from "../App";
import { RouteProp } from "@react-navigation/native";
import Profile from "../components/Profile";
import GlobalStyle from "../Style";

const ProfileScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Profile">;
}) => {
  const { contact } = route.params;

  return (
    <SafeAreaView style={GlobalStyle.container}>
      <Profile contact={contact} />
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    marginLeft: "10%",
    marginRight: "10%",
    padding: 15,
    marginTop: 20,
  },
  buttonText: {
    textTransform: "uppercase",
    marginLeft: 10,
    fontWeight: "bold",
    opacity: 0.6,
  },
  icon: {
    opacity: 0.6,
  },
  root: {
    marginTop: "10%",
  },
});
