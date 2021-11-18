import React from "react";
import { SafeAreaView, TouchableOpacity, Linking } from "react-native";
import { Row } from "../components/Profile/Row";
import { version } from "../utils/version";
import { AntDesign } from "@expo/vector-icons";
import HelpsUrls from "../utils/HelpUrls";

const AppInformationScreen = () => {
  return (
    <SafeAreaView>
      <Row label="App version" value={version} />

      <TouchableOpacity onPress={() => Linking.openURL(HelpsUrls.jabberGithub)}>
        <Row
          label="Smart contract repository"
          value={<AntDesign name="github" size={24} color="black" />}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => Linking.openURL(HelpsUrls.jabberMobileGithub)}
      >
        <Row
          label="App repository"
          value={<AntDesign name="github" size={24} color="black" />}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AppInformationScreen;
