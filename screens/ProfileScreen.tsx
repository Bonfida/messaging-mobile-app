import React from "react";
import { SafeAreaView } from "react-native";
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
