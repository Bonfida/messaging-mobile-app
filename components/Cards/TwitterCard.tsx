import React from "react";
import LightGradientCard from "./LightGradientCard";
import {
  View,
  Linking,
  StyleSheet,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import HelpsUrls from "../../utils/HelpUrls";
import GlobalStyle from "../../Style";

const TwitterCard = () => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => Linking.openURL(HelpsUrls.verifyTwitter)}
    >
      <LightGradientCard borderRadius={8} width={"100%"} height={180}>
        <View style={styles.innerContainer}>
          <Image
            source={require("../../assets/twitter.png")}
            style={styles.twitter}
          />

          <Text style={styles.domain}>Twitter handle</Text>

          <Text style={GlobalStyle.whiteText}>
            Verifying your Twitter handle makes it easier for people to find you
            also
          </Text>
        </View>
      </LightGradientCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10,
  },
  domain: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "Rota-Regular",
    color: "#77E3EF",
  },
  twitter: {
    width: 40,
    height: 32,
  },
  innerContainer: {
    margin: "5%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-around",
    height: "80%",
  },
});

export default TwitterCard;
