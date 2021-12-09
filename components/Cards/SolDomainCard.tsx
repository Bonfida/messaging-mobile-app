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

const SolDomainCard = () => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => Linking.openURL(HelpsUrls.buyDomain)}
    >
      <LightGradientCard borderRadius={8} width={"100%"} height={180}>
        <View style={styles.innerContainer}>
          <Image source={require("../../assets/SOL.png")} style={styles.sol} />

          <Text style={styles.domain}>yourname.sol</Text>

          <Text style={GlobalStyle.whiteText}>
            Get a domain name on the Solana chain and bind it to your wallet
            address
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
  sol: {
    width: 48,
    height: 48,
  },
  innerContainer: {
    margin: "5%",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-around",
    height: "80%",
  },
});

export default SolDomainCard;
