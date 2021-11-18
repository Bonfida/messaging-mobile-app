import React, { useState } from "react";
import {
  TextInput,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useConnection } from "../utils/connection";
import { useNavigation } from "@react-navigation/core";
import { useWallet } from "../utils/wallet";
import { validateInput } from "../utils/utils.native";
import { PublicKey } from "@solana/web3.js";
import {
  getTwitterRegistry,
  NameRegistryState,
} from "@bonfida/spl-name-service";
import { getHashedName, getNameAccountKey } from "../utils/web3/name-service";
import { SOL_TLD_AUTHORITY } from "../utils/name-service";
import {
  Thread,
  createThread,
  GroupThread,
  GroupThreadIndex,
  createGroupIndex,
} from "../utils/web3/jabber";
import { asyncCache } from "../utils/cache";
import { profileScreenProp } from "../types";
import { TWFWrapper } from "../utils/utils.native";
import { balanceWarning } from "./BalanceWarning";
import { AntDesign } from "@expo/vector-icons";

const ModalContent = ({
  setVisible,
}: {
  setVisible: (arg: boolean) => void;
}) => {
  const [contact, setContact] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<profileScreenProp>();
  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();

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

      await asyncCache.set(receiverAddress.toBase58(), displayName);

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
    <TWFWrapper>
      <View style={styles.safeArea}>
        <View style={styles.root}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Domain name"
            style={styles.input}
            onChangeText={(text) => setContact(text.trim())}
            value={contact || ""}
          />
          <Text style={styles.text}>
            Enter the domain name of your contact (e.g bonfida.sol) or a group
            address
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setVisible(false);
            navigation.navigate("Create Group");
          }}
        >
          <AntDesign
            name="addusergroup"
            size={24}
            color="black"
            style={styles.groupIcon}
          />
          <Text>Create group</Text>
        </TouchableOpacity>
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
    </TWFWrapper>
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
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    marginLeft: "10%",
    marginRight: "10%",
    padding: 15,
    marginTop: 20,
  },
  groupIcon: {
    marginRight: 10,
  },
});
