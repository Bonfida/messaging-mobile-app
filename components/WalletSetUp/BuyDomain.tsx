import React from "react";
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import HelpsUrls from "../../utils/HelpUrls";
import { useWallet } from "../../utils/wallet";
import { Step } from "../../types";

const DomainButton = () => {
  const handleOnPress = () => {
    Linking.openURL(HelpsUrls.buyDomain);
  };

  return (
    <TouchableOpacity style={styles.externalButton} onPress={handleOnPress}>
      <Image
        source={require("../../assets/solana-sol-logo.png")}
        style={{ width: 20, height: 20 }}
      />
      <Text style={styles.externalButtonText}>Get domain name</Text>
    </TouchableOpacity>
  );
};

const TwitterButton = () => {
  const handleOnPress = () => {
    Linking.openURL(HelpsUrls.verifyTwitter);
  };

  return (
    <TouchableOpacity style={styles.externalButton} onPress={handleOnPress}>
      <AntDesign name="twitter" size={24} color="black" />
      <Text style={styles.externalButtonText}>Verify Twitter handle</Text>
    </TouchableOpacity>
  );
};

export const BuyDomain = ({
  setStep,
}: {
  setStep: React.Dispatch<React.SetStateAction<Step>>;
}) => {
  const { refresh } = useWallet();

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Help people find you 🧐</Text>
      <Text style={styles.explanation}>
        Your wallet does not own a domain name or verified Twitter handle.
        Owning a domain name (e.g bonfida.sol) or Twitter handle (@bonfida) will
        make it easier for your contact to find you.
      </Text>

      <DomainButton />
      <TwitterButton />

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => setStep(Step.Welcome)}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonContainer} onPress={refresh}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  explanation: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
  },
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  buttonContainer: {
    margin: 20,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "40%",
  },
  buttonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  externalButton: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    width: "80%",
    padding: 15,
    marginTop: 20,
  },
  externalButtonText: {
    textTransform: "uppercase",
    marginLeft: 10,
    fontWeight: "bold",
    opacity: 0.6,
  },
});
