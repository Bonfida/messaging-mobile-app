import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  TouchableOpacity,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { setUserProfile } from "../utils/web3/jabber";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { signAndSendTransactionInstructions } from "../utils/utils";

const EditFeeScreen = () => {
  const connection = useConnection();
  const { wallet } = useWallet();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string | null>(null);

  const handleOnSubmit = async () => {
    if (!wallet) return;
    if (!amount) {
      return alert("Enter an amount");
    }
    const parsedAmount = parseFloat(amount);
    if (parsedAmount < 0 || isNaN(parsedAmount) || !isFinite(parsedAmount)) {
      return alert("Invalid amount");
    }
    try {
      setLoading(true);
      const instruction = await setUserProfile(
        wallet?.publicKey,
        "",
        "",
        LAMPORTS_PER_SOL * parsedAmount
      );
      await signAndSendTransactionInstructions(connection, [], wallet, [
        instruction,
      ]);
      Alert.alert("Amount updated!");
    } catch {
      Alert.alert("Error, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <View style={styles.imgContainer}>
            <Image
              style={styles.img}
              source={require("../assets/transaction.png")}
            />
          </View>
          <Text style={styles.text}>
            You can be paid to receive message, this means each time someone
            sends you a message they will pay the amount of SOL you specified
          </Text>
          <TextInput
            keyboardType="numeric"
            style={styles.input}
            onChangeText={setAmount}
            placeholder="New amount"
          />
        </View>

        <View>
          <TouchableOpacity
            disabled={!amount || loading}
            style={styles.buttonContainer}
            onPress={handleOnSubmit}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Enter</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default EditFeeScreen;

const styles = StyleSheet.create({
  root: {
    marginTop: "10%",
  },
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
  },
  text: {
    fontSize: 18,
    margin: 20,
    fontWeight: "bold",
  },
  input: {
    padding: 10,
    borderWidth: 0.5,
    borderRadius: 20,
    margin: 20,
  },
  buttonContainer: {
    margin: 20,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  img: {
    width: 90,
    height: 90,
  },
  imgContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "10%",
  },
});
