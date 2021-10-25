import React, { useState } from "react";
import {
  TextInput,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useConnection } from "../utils/connection";
import { useNavigation } from "@react-navigation/core";
import { useWallet } from "../utils/wallet";
import {
  signAndSendTransactionInstructions,
  validateInput,
} from "../utils/utils";
import { PublicKey } from "@solana/web3.js";
import { NameRegistryState } from "@bonfida/spl-name-service";
import { getHashedName, getNameAccountKey } from "../utils/web3/name-service";
import { SOL_TLD_AUTHORITY } from "../utils/name-service";
import { Thread, createThread } from "../utils/web3/jabber";

const ModalContent = ({
  setVisible,
}: {
  setVisible: (arg: boolean) => void;
}) => {
  const [contact, setContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const connection = useConnection();
  const { wallet } = useWallet();

  const handleOnPress = async () => {
    if (!contact || !wallet) return;

    const { valid, input, twitter, domain } = validateInput(contact);
    if (!valid || !input || twitter) {
      return Alert.alert("Enter a valid domain name");
    }

    try {
      setLoading(true);
      let receiverAddress: PublicKey | null = null;
      if (domain) {
        const hashed = getHashedName(input);

        const domainKey = getNameAccountKey(
          hashed,
          undefined,
          SOL_TLD_AUTHORITY
        );

        const nameRegistry = await NameRegistryState.retrieve(
          connection,
          domainKey
        );
        receiverAddress = nameRegistry.owner;
      }

      if (!receiverAddress) {
        return Alert.alert("Invalid contact");
      }

      // Check if thread already exists
      try {
        await Thread.retrieve(connection, wallet.publicKey, receiverAddress);
        navigation.navigate("Message", {
          contact: receiverAddress.toBase58(),
        });
        return setVisible(false);
      } catch (err) {
        console.log("Thread does not exists");
      }

      const instructions = await createThread(
        wallet.publicKey,
        receiverAddress,
        wallet.publicKey
      );

      await signAndSendTransactionInstructions(connection, [], wallet, [
        instructions,
      ]);

      navigation.navigate("Message", {
        contact: receiverAddress.toBase58(),
      });

      setLoading(false);
      setVisible(false);
    } catch (err) {
      console.log("Error", err);
      setLoading(false);
      Alert.alert("Error, try again");
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.root}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Domain name"
          style={styles.input}
          onChangeText={(text) => setContact(text.toLocaleLowerCase().trim())}
          value={contact || ""}
        />
        <Text style={styles.text}>
          Enter the domain name of your contact (e.g bonfida.sol)
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          disabled={loading}
          style={styles.buttonContainer}
          onPress={() => setVisible(false)}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!contact || loading}
          style={styles.buttonContainer}
          onPress={handleOnPress}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>Enter</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ModalContent;

const styles = StyleSheet.create({
  input: {
    backgroundColor: "white",
    padding: 15,
  },
  text: {
    fontSize: 14,
    margin: 20,
    opacity: 0.5,
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
  root: {
    marginTop: "30%",
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
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
    backgroundColor: "rgb(240 ,240, 240)",
  },
  buttonsContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
