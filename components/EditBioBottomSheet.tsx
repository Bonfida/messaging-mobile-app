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
import { Profile, setUserProfile, createProfile } from "../utils/web3/jabber";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet.native";
import { balanceWarning } from "../components/BalanceWarning";

const Title = ({ title }: { title: string }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
    </View>
  );
};

const EditBioBottomSheet = ({
  currentBio,
  visible,
  setVisible,
}: {
  currentBio: string | undefined | null;
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [bio, setBio] = useState<null | string>(null);
  const keyboardOffset = useKeyBoardOffset();
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();
  const [loading, setLoading] = useState(false);

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
          currentProfile.pictureHash,
          currentProfile.displayDomainName,
          bio,
          currentProfile.lamportsPerMessage.toNumber(),
          currentProfile.allowDm,
          wallet.publicKey
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
    <BottomSheet
      visible={visible}
      onBackButtonPress={() => setVisible(false)}
      onBackdropPress={() => setVisible(false)}
    >
      <View
        style={[styles.bottomNavigationView, { marginBottom: keyboardOffset }]}
      >
        <View style={styles.container}>
          <Title title="Change bio" />
          {currentBio && (
            <Text style={{ ...GlobalStyle.darkBlue, margin: 10 }}>
              {currentBio}
            </Text>
          )}
          <TextInput
            autoCapitalize="none"
            placeholder="New bio"
            style={styles.textInput}
            placeholderTextColor="#C8CCD6"
            onChangeText={setBio}
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

export default EditBioBottomSheet;

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 230,
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
