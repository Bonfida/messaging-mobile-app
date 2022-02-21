import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import { useKeyBoardOffset } from "../utils/utils.native";
import BlueButton from "./Buttons/BlueGradient";
import {
  Profile,
  setUserProfile,
  createProfile,
  GroupThread,
  editGroupThread,
} from "../utils/web3/jabber";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet.native";
import { balanceWarning } from "../components/BalanceWarning";
import { isWeb } from "../utils/utils";

const Title = ({ title }: { title: string }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
    </View>
  );
};

const updateFeeIndividual = async (
  connection: Connection,
  address: PublicKey,
  amount: number
) => {
  // Check if profile exists
  try {
    const currentProfile = await Profile.retrieve(connection, address);
    const instruction = await setUserProfile(
      currentProfile.pictureHash,
      currentProfile.displayDomainName,
      currentProfile.bio,
      LAMPORTS_PER_SOL * amount,
      currentProfile.allowDm,
      address
    );
    return instruction;
  } catch {
    const createInstruction = await createProfile(
      address,
      "",
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
    visible,
  } = await GroupThread.retrieveFromKey(connection, groupKey);
  const instruction = await editGroupThread(
    groupName,
    owner,
    destinationWallet,
    new BN(LAMPORTS_PER_SOL * amount),
    mediaEnabled,
    adminOnly,
    groupPicHash,
    visible
  );
  return instruction;
};

const EditFeeBottomSheet = ({
  visible,
  setVisible,
  groupAddress,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  groupAddress?: string;
}) => {
  const [amount, onChangeAmount] = useState<null | string>(null);
  const keyboardOffset = useKeyBoardOffset();
  const isGroup = !!groupAddress;
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();
  const [loading, setLoading] = useState(false);

  const handleOnPress = async () => {
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
        ? updateFeeGroup(connection, new PublicKey(groupAddress), parsedAmount)
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
    <BottomSheet
      visible={visible}
      onBackButtonPress={() => setVisible(false)}
      onBackdropPress={() => setVisible(false)}
    >
      <View
        style={[styles.bottomNavigationView, { marginBottom: keyboardOffset }]}
      >
        <View style={styles.container}>
          <Title title="Change message fee" />
          <TextInput
            autoCapitalize="none"
            placeholder="New message fee"
            style={styles.textInput}
            placeholderTextColor="#C8CCD6"
            onChangeText={onChangeAmount}
          />
        </View>
        <View style={styles.button}>
          <BlueButton
            borderRadius={28}
            width={120}
            height={56}
            onPress={handleOnPress}
            transparent
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Confirm</Text>
            )}
          </BlueButton>
        </View>
      </View>
    </BottomSheet>
  );
};

export default EditFeeBottomSheet;

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 200,
    ...GlobalStyle.background,
  },
  title: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h2: {
    ...GlobalStyle.h2,
    fontWeight: "bold",
  },
  container: {
    width: "80%",
    marginLeft: "10%",
    marginRight: "10%",
    marginTop: "5%",
  },
  textInput: {
    backgroundColor: "#F0F5FF",
    borderRadius: 2,
    height: 40,
    width: 327,
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    color: "#2A2346",
  },
  strong: {
    fontWeight: "bold",
  },
  buttonText: {
    fontSize: 18,
    ...GlobalStyle.white,
  },
  button: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
  },
});
