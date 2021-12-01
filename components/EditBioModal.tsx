import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet";
import { Profile, setUserProfile, createProfile } from "../utils/web3/jabber";
import { TWFWrapper } from "../utils/utils.native";
import { balanceWarning } from "./BalanceWarning";

export const BioModalContent = ({
  setVisible,
}: {
  setVisible: (arg: boolean) => void;
}) => {
  const [bio, setBio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { wallet, sendTransaction, hasSol } = useWallet();
  const connection = useConnection();

  const handleOnPress = async () => {
    if (!wallet) return;
    if (!bio) {
      return alert("Enter a bio");
    }
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }

    try {
      setLoading(true);
      try {
        const currentProfile = await Profile.retrieve(
          connection,
          wallet.publicKey
        );
        const instruction = await setUserProfile(
          wallet?.publicKey,
          currentProfile.name,
          bio,
          currentProfile.lamportsPerMessage.toNumber()
        );

        await sendTransaction({
          connection,
          signers: [],
          wallet,
          instruction: [instruction],
        });
      } catch {
        const createInstruction = await createProfile(
          wallet.publicKey,
          "",
          bio,
          0
        );
        await sendTransaction({
          connection,
          signers: [],
          wallet,
          instruction: [createInstruction],
        });
      }

      Alert.alert("Bio updated!");
      setLoading(false);
      setVisible(false);
    } catch (err) {
      setLoading(false);
      Alert.alert("Error, try again");
    }
  };

  return (
    <TWFWrapper>
      <View style={styles.safeArea}>
        <View style={styles.root}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Bio"
            style={styles.input}
            onChangeText={setBio}
            value={bio || ""}
          />
          <Text style={styles.text}>Enter your bio</Text>
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
            disabled={!bio || loading}
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
    </TWFWrapper>
  );
};

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
    fontSize: 14,
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