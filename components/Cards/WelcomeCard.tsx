import React from "react";
import { StyleSheet, View, Image, Text } from "react-native";
import BlueTextGradient from "../TextGradients/BlueTextGradient";
import { LinearGradient } from "expo-linear-gradient";
import HelpsUrls from "../../utils/HelpUrls";

const FIDA_MINT = "EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp";

const BottomCard = () => {
  return (
    <View style={styles.bottomCard}>
      <View>
        <BlueTextGradient
          textStyle={styles.gradientStyle}
          maskStyle={styles.maskStyle}
          text="bonfida.sol"
          start={{ x: 0.5, y: 0.5 }}
        />
      </View>
      <View>
        <Text style={styles.mintText}>{FIDA_MINT}</Text>
      </View>
    </View>
  );
};

const WelcomeCard = () => {
  return (
    <>
      <View style={styles.container}>
        <LinearGradient
          colors={["rgba(19, 30, 48, 1)", "#0F0F11"]}
          style={styles.card}
        >
          <View style={styles.innerContainer}>
            <View style={styles.topContainer}>
              <Image
                source={require("../../assets/adaptive-icon.png")}
                style={styles.logo}
              />
            </View>
            <View style={styles.bottomCard}>
              <BottomCard />
            </View>
          </View>
        </LinearGradient>
      </View>
    </>
  );
};

export default WelcomeCard;

const styles = StyleSheet.create({
  card: {
    width: "95%",
    height: 219,
    borderRadius: 12,
  },
  gradientStyle: {
    fontSize: 26,
    textTransform: "uppercase",
    textAlign: "right",
    fontFamily: "Rota-Regular",
  },
  maskStyle: {
    height: 30,
  },
  container: {
    marginTop: "10%",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(255, 255, 255, 0.25)",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,
    elevation: 24,
  },
  innerContainer: {
    height: "100%",
    position: "relative",
  },
  topContainer: {
    top: 15,
    left: 10,
    position: "absolute",
  },
  bottomCard: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  logo: {
    height: 62,
    width: 62,
    margin: 5,
  },
  mintText: {
    color: "#9BA3B5",
    fontSize: 12,
    fontFamily: "Rota-Regular",
  },
});
