import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather, Entypo } from "@expo/vector-icons";
import { Row } from "../components/Profile/Row";
import { FontAwesome } from "@expo/vector-icons";
import { useWallet } from "../utils/wallet";
import {
  createGroupThread,
  GroupThread,
  createGroupIndex,
} from "../utils/web3/jabber";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useConnection } from "../utils/connection";
import { isWeb } from "../utils/utils";
import { sleep, TWFWrapper } from "../utils/utils.native";
import { useNavigation } from "@react-navigation/native";
import { groupMessagesScreenProp } from "../types";
import { balanceWarning } from "../components/BalanceWarning";

const CreateGroupScreen = () => {
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();
  const navigation = useNavigation<groupMessagesScreenProp>();
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState<null | string>(null);
  const [destinationWallet, setDestinationWallet] = useState<null | string>(
    null
  );
  const [lamportsPerMessage, setLamportsPerMessage] = useState("0");
  const [mediaEnabled, setMediaEnabled] = useState(false);

  const handleOnPress = async () => {
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }

    const parsedGroupName = groupName?.trim();
    const parsedDestinationWallet = destinationWallet
      ? new PublicKey(destinationWallet)
      : wallet.publicKey;

    const parsedLamportsPerMessage = parseFloat(lamportsPerMessage);

    if (!parsedGroupName) {
      return isWeb
        ? alert("Invalid group name")
        : Alert.alert("Invalid input", "Enter a valid group name");
    }

    if (
      isNaN(parsedLamportsPerMessage) ||
      !isFinite(parsedLamportsPerMessage) ||
      parsedLamportsPerMessage < 0
    ) {
      return isWeb
        ? alert("Invalid SOL amount")
        : Alert.alert("Invalid input", "Please enter a valid SOL amount");
    }

    try {
      setLoading(true);
      const createGroupInstruction = await createGroupThread(
        parsedGroupName,
        parsedDestinationWallet,
        new BN(parsedLamportsPerMessage * LAMPORTS_PER_SOL),
        [] as PublicKey[],
        wallet.publicKey,
        mediaEnabled,
        false, // TODO change
        wallet.publicKey,
        false
      );

      const groupKey = await GroupThread.getKey(
        parsedGroupName,
        wallet.publicKey
      );
      // Check if already exists and redirect if yes
      const groupInfo = await connection.getAccountInfo(groupKey);
      if (groupInfo?.data) {
        setLoading(false);
        return navigation.navigate("Group Messages", {
          group: groupKey.toBase58(),
          name: parsedGroupName,
        });
      }

      const indexGroupInstruction = await createGroupIndex(
        parsedGroupName,
        wallet.publicKey,
        groupKey
      );

      const tx = await sendTransaction({
        instruction: [createGroupInstruction, indexGroupInstruction],
        connection,
        wallet,
        signers: [],
      });

      // Wait for propagation
      await sleep(2_500);
      console.log(tx);
      setLoading(false);
      navigation.navigate("Group Messages", {
        group: groupKey.toBase58(),
        name: parsedGroupName,
      });
    } catch (err) {
      console.log(err);
      isWeb
        ? alert(`Error ${err}`)
        : Alert.alert("Error creating group", `${err}`);
      setLoading(false);
    }
  };

  return (
    <TWFWrapper>
      <ScrollView>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.imageContainer}>
            <FontAwesome name="group" size={80} color="black" />
          </View>
          <View style={{ width: "100%" }}>
            {/* Group name */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                onChangeText={setGroupName}
                placeholder="Group Name"
              />
            </View>

            {/* Destination wallet */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                onChangeText={setDestinationWallet}
                placeholder="Fee Collection Address (optional)"
              />
            </View>

            {/* SOL per message */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                onChangeText={setLamportsPerMessage}
                placeholder="SOL per message"
              />
            </View>

            {/* Media enabled */}
            <TouchableOpacity onPress={() => setMediaEnabled((prev) => !prev)}>
              <Row
                label="Allow images and videos"
                value={
                  mediaEnabled ? (
                    <Feather name="check" size={24} color="green" />
                  ) : (
                    <Entypo name="circle-with-cross" size={24} color="red" />
                  )
                }
              />
            </TouchableOpacity>

            {/* Encryption warning */}
            <View style={styles.encryptionWarning}>
              <Text>⚠️ Unlike DMs, group messages are unencrypted</Text>
            </View>
          </View>
          <TouchableOpacity
            disabled={loading}
            style={styles.buttonContainer}
            onPress={handleOnPress}
          >
            <Text style={styles.buttonText}>
              {loading ? <ActivityIndicator /> : "Confirm"}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </TWFWrapper>
  );
};

export default CreateGroupScreen;

const styles = StyleSheet.create({
  imageContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgb(240 ,240, 240)",
  },
  inputContainer: {
    marginTop: 0.5,
    marginBottom: 0.5,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
  },
  checkbox: {
    margin: 8,
  },
  buttonContainer: {
    margin: 20,
    elevation: 8,
    backgroundColor: "#007bff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: "80%",
  },
  buttonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  encryptionWarning: {
    display: "flex",
    alignItems: "center",
    marginTop: 20,
  },
});
