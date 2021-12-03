import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageProps,
  TextInput,
  Alert,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import BlueButton from "./Buttons/BlueGradient";
import { useKeyBoardOffset } from "../utils/utils.native";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet.native";
import { balanceWarning } from "./BalanceWarning";
import { validateInput } from "../utils/utils.native";
import { PublicKey } from "@solana/web3.js";
import {
  Thread,
  createThread,
  GroupThread,
  GroupThreadIndex,
  createGroupIndex,
} from "../utils/web3/jabber";
import { useNavigation } from "@react-navigation/core";
import { profileScreenProp } from "../types";
import { getHashedName, getNameAccountKey } from "../utils/web3/name-service";
import { SOL_TLD_AUTHORITY } from "../utils/name-service";
import {
  getTwitterRegistry,
  NameRegistryState,
} from "@bonfida/spl-name-service";
import { asyncCache } from "../utils/cache";

enum Step {
  DmOrGroup,
  Dm,
  Group,
  JoinGroup,
}

const CloseIcon = ({ close }: { close: () => void }) => {
  return (
    <TouchableOpacity onPress={close}>
      <Image source={require("../assets/close.png")} />
    </TouchableOpacity>
  );
};

const Title = ({ title, close }: { title: string; close: () => void }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
      <CloseIcon close={close} />
    </View>
  );
};

const Row = ({
  icon,
  label,
  handleOnPress,
}: {
  icon: ImageProps;
  label: string;
  handleOnPress: () => void;
}) => {
  return (
    <TouchableOpacity style={styles.row} onPress={handleOnPress}>
      <Image style={styles.img} source={icon} />
      <Text style={[GlobalStyle.text, { marginLeft: 20 }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const NewChatBottomSheet = ({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(Step.DmOrGroup);
  const connection = useConnection();
  const { wallet, hasSol, sendTransaction } = useWallet();
  const keyboardOffset = useKeyBoardOffset();
  const [contact, setContact] = useState<string | null>(null);
  const navigation = useNavigation<profileScreenProp>();

  const close = () => {
    setStep(Step.DmOrGroup);
    setVisible((prev) => !prev);
  };

  const handleOnPress = async () => {
    if (!contact || !wallet) return;
    if (!(await hasSol())) {
      return balanceWarning(wallet.publicKey.toBase58());
    }
    const { valid, input, twitter, domain, pubkey } = validateInput(contact);
    if (!valid || !input) {
      return Alert.alert("Enter a valid domain name");
    }

    try {
      setLoading(true);
      let receiverAddress: PublicKey | null = null;
      if (pubkey) {
        receiverAddress = new PublicKey(input);
        // Check if it's group
        try {
          const group = await GroupThread.retrieveFromKey(
            connection,
            receiverAddress
          );
          const groupIndexAddress = await GroupThreadIndex.getKey(
            group.groupName,
            wallet.publicKey,
            receiverAddress
          );

          const info = await connection.getAccountInfo(groupIndexAddress);
          if (!info?.data) {
            const createIndexInstruction = await createGroupIndex(
              group.groupName,
              wallet.publicKey,
              receiverAddress
            );

            await sendTransaction({
              instruction: [createIndexInstruction],
              signers: [],
              connection,
              wallet,
            });
          }

          setLoading(false);
          setVisible(false);

          return navigation.navigate("Group Messages", {
            group: input,
            name: group.groupName,
          });
        } catch (err) {
          console.log(err);
        }
      }

      if (domain) {
        const hashed = await getHashedName(input);

        const domainKey = await getNameAccountKey(
          hashed,
          undefined,
          SOL_TLD_AUTHORITY
        );

        const nameRegistry = await NameRegistryState.retrieve(
          connection,
          domainKey
        );
        receiverAddress = nameRegistry.owner;
      } else if (twitter) {
        const twitterRegistry = await getTwitterRegistry(connection, input);
        receiverAddress = twitterRegistry.owner;
      }

      if (!receiverAddress) {
        return Alert.alert("Invalid contact");
      }

      const displayName = domain || pubkey ? input + ".sol" : "@" + input;

      await asyncCache.set(receiverAddress.toBase58(), [displayName]);

      // Check if thread already exists
      try {
        await Thread.retrieve(connection, wallet.publicKey, receiverAddress);
        navigation.navigate("Profile", {
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
      await sendTransaction({
        connection,
        signers: [],
        instruction: [instructions],
        wallet: wallet,
      });

      setLoading(false);
      setVisible(false);

      navigation.navigate("Profile", {
        contact: receiverAddress.toBase58(),
      });
    } catch (err) {
      console.log("Error", err);
      setLoading(false);
      Alert.alert("Error, try again");
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onBackButtonPress={close}
      onBackdropPress={close}
    >
      <View
        style={[styles.bottomNavigationView, { marginBottom: keyboardOffset }]}
      >
        {step === Step.DmOrGroup && (
          <>
            <View style={styles.container}>
              <Title title="New chat" close={close} />
              <Row
                icon={require("../assets/new-dm.png")}
                label="New direct message"
                handleOnPress={() => setStep(Step.Dm)}
              />
              <Row
                icon={require("../assets/new-group.png")}
                label="New Group message"
                handleOnPress={() => setStep(Step.Group)}
              />
              <Row
                icon={require("../assets/new-group.png")}
                label="Join a group"
                handleOnPress={() => setStep(Step.JoinGroup)}
              />
            </View>
          </>
        )}
        {step === Step.Dm && (
          <View style={styles.container}>
            <Title title="Direct message" close={close} />
            <Text style={[GlobalStyle.text, { marginTop: 20 }]}>
              Enter the domain of your contact e.g. bonfida.sol
            </Text>
            <TextInput
              autoCapitalize="none"
              style={styles.textInput}
              placeholder="Domain e.g bonfida.sol"
              placeholderTextColor="#C8CCD6"
              onChangeText={setContact}
            />
            <View style={styles.button}>
              <BlueButton
                borderRadius={28}
                width={120}
                height={56}
                onPress={handleOnPress}
              >
                <Text style={styles.buttonText}>Search</Text>
              </BlueButton>
            </View>
          </View>
        )}
        {step === Step.JoinGroup && (
          <View style={styles.container}>
            <Title title="Join a group" close={close} />
            <Text style={[GlobalStyle.text, { marginTop: 20 }]}>
              Enter the domain or address of the group
            </Text>
            <TextInput
              autoCapitalize="none"
              style={styles.textInput}
              placeholder="Group address"
              placeholderTextColor="#C8CCD6"
              onChangeText={setContact}
            />
            <View style={styles.button}>
              <BlueButton
                borderRadius={28}
                width={120}
                height={56}
                onPress={handleOnPress}
              >
                <Text style={styles.buttonText}>Search</Text>
              </BlueButton>
            </View>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: 250,
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
  row: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 20,
  },
  img: {
    width: 40,
    height: 40,
  },
  textInput: {
    backgroundColor: "#181F2B",
    borderRadius: 2,
    height: 40,
    width: 327,
    borderColor: "#9BA3B5",
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    color: "#C8CCD6",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    ...GlobalStyle.blue,
  },
  button: {
    marginTop: 20,
    display: "flex",
    alignItems: "center",
  },
});

export default NewChatBottomSheet;
