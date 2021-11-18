import React, { useState } from "react";
import {
  SafeAreaView,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  Profile,
  setUserProfile,
  createProfile,
  GroupThread,
  editGroupThread,
} from "../utils/web3/jabber";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { TWFWrapper } from "../utils/utils.native";
import { isWeb } from "../utils/utils";
import BN from "bn.js";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { balanceWarning } from "../components/BalanceWarning";

const updateFeeIndividual = async (
  connection: Connection,
  address: PublicKey,
  amount: number
) => {
  // Check if profile exists
  try {
    const currentProfile = await Profile.retrieve(connection, address);
    const instruction = await setUserProfile(
      address,
      currentProfile.name,
      currentProfile.bio,
      LAMPORTS_PER_SOL * amount
    );
    return instruction;
  } catch {
    const createInstruction = await createProfile(
      address,
      "",
      "",
      LAMPORTS_PER_SOL * amount
    );
    return createInstruction;
  }
};

const updateFeeGroup = async (
  connection: Connection,
  groupKey: PublicKey,
  amount: number
) => {
  const {
    groupName,
    owner,
    destinationWallet,
    mediaEnabled,
    adminOnly,
    groupPicHash,
  } = await GroupThread.retrieveFromKey(connection, groupKey);
  const instruction = await editGroupThread(
    groupName,
    owner,
    destinationWallet,
    new BN(LAMPORTS_PER_SOL * amount),
    mediaEnabled,
    adminOnly,
    groupPicHash
  );
  return instruction;
};

const EditFeeScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Edit Fee">;
}) => {
  const { groupKey } = route.params;
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string | null>(null);
  const isGroup = !!groupKey;

  const handleOnSubmit = async () => {
    if (!wallet) return;
    if (!amount) {
      return alert("Enter an amount");
    }
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    const parsedAmount = parseFloat(amount);
    if (parsedAmount < 0 || isNaN(parsedAmount) || !isFinite(parsedAmount)) {
      return alert("Invalid amount");
    }
    try {
      setLoading(true);
      const instruction = await (isGroup
        ? updateFeeGroup(connection, new PublicKey(groupKey), parsedAmount)
        : updateFeeIndividual(connection, wallet.publicKey, parsedAmount));
      const tx = await sendTransaction({
        connection,
        instruction: [instruction],
        signers: [],
        wallet,
      });
      console.log(tx);
      isWeb ? alert("Amount updated") : Alert.alert("Amount updated!");
    } catch (err) {
      console.log(err);
      isWeb ? alert("Error, try agai") : Alert.alert("Error, try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TWFWrapper>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <TextInput
            style={styles.input}
            onChangeText={setAmount}
            placeholder="New amount"
          />
          {isGroup ? (
            <Text style={styles.text}>
              Each time someone sends a message he will have to pay this amount
            </Text>
          ) : (
            <Text style={styles.text}>
              You can be paid to receive message, this means each time someone
              sends you a message they will pay the amount of SOL you specified
            </Text>
          )}
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
    </TWFWrapper>
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
    fontSize: 14,
    margin: 20,
    opacity: 0.5,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
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
