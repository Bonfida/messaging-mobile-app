import React from "react";
import { SafeAreaView, TouchableOpacity, Linking } from "react-native";
import { Row } from "../components/Profile/Row";
import { version } from "../utils/version";
import { AntDesign } from "@expo/vector-icons";
import HelpsUrls from "../utils/HelpUrls";
import GlobalStyle from "../Style";

const Github = () => {
  return <AntDesign name="github" size={24} color="#77E3EF" />;
};

const AppInformationScreen = () => {
  return (
    <SafeAreaView style={GlobalStyle.container}>
      <Row label="App version" value={version} />

      <TouchableOpacity onPress={() => Linking.openURL(HelpsUrls.jabberGithub)}>
        <Row label="Smart contract repository" value={<Github />} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL(HelpsUrls.jabberMobileGithub)}
      >
        <Row label="App repository" value={<Github />} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AppInformationScreen;
