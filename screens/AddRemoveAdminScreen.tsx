import React, { useState } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import { useConnection } from "../utils/connection";
import { useWallet } from "../utils/wallet";
import { abbreviateAddress, TWFWrapper } from "../utils/utils.native";
import { addAdminToGroup, removeAdminFromGroup } from "@bonfida/jabber";
import { PublicKey } from "@solana/web3.js";
import { isWeb } from "../utils/utils";
import { useGroupData } from "../utils/jabber";
import { useDisplayName } from "../utils/name-service";
import { Row } from "../components/Profile/Row";
import { MaterialIcons } from "@expo/vector-icons";
import { validateInput } from "../utils/utils.native";
import { getHashedName, getNameAccountKey } from "../utils/web3/name-service";
import { SOL_TLD_AUTHORITY } from "../utils/name-service";
import {
  getTwitterRegistry,
  NameRegistryState,
} from "@bonfida/spl-name-service";
import { balanceWarning } from "../components/BalanceWarning";

const AdminRow = ({
  adminAddress,
  handleOnPress,
}: {
  adminAddress: string;
  handleOnPress: () => Promise<void>;
}) => {
  const [displayName] = useDisplayName(adminAddress);
  if (!displayName) {
    return null;
  }
  return (
    <Row
      label={`${displayName[0]} (${abbreviateAddress(adminAddress)})`}
      value={
        <TouchableOpacity style={{ paddingTop: 5 }} onPress={handleOnPress}>
          <MaterialIcons name="delete" size={24} color="red" />
        </TouchableOpacity>
      }
    />
  );
};

const AddRemoveAdminScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Edit Admins">;
}) => {
  const { group } = route.params;
  const [loading, setLoading] = useState(false);
  const [admin, setAdmin] = useState<null | string>(null);
  const groupData = useGroupData(group);

  const connection = useConnection();
  const { wallet, sendTransaction, hasSol } = useWallet();

  const handleOnPress =
    (addAdmin: boolean, adminAddress: string | undefined | null) =>
    async () => {
      if (!wallet || !groupData) return;
      if (!(await hasSol())) {
        return balanceWarning(wallet.publicKey.toBase58());
      }
      if (!adminAddress) {
        return isWeb
          ? alert("Enter a valid admin")
          : Alert.alert("Invalid Input", "Please enter a valid admin");
      }
      try {
        setLoading(true);
        const groupKey = new PublicKey(group);
        // Parse admin
        let parsedAdmin: PublicKey;
        const { valid, input, twitter, domain } = validateInput(adminAddress);
        if (!valid || !input) {
          return Alert.alert("Enter a valid domain name");
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
          parsedAdmin = nameRegistry.owner;
        } else if (twitter) {
          const twitterRegistry = await getTwitterRegistry(connection, input);
          parsedAdmin = twitterRegistry.owner;
        } else {
          parsedAdmin = new PublicKey(input);
        }

        const adminIndex = groupData?.admins.findIndex((g) =>
          g.equals(parsedAdmin)
        );

        if (adminIndex === -1 && !addAdmin) {
          return isWeb
            ? alert("This address is not an admin")
            : Alert.alert("Invalid Input", "This address is not an admin");
        }

        if (adminIndex !== -1 && addAdmin) {
          return isWeb
            ? alert("This address is already an admin")
            : Alert.alert("Invalid Input", "This address is already an admin");
        }

        const instruction = addAdmin
          ? addAdminToGroup(groupKey, parsedAdmin, groupData.owner)
          : removeAdminFromGroup(
              groupKey,
              parsedAdmin,
              adminIndex,
              groupData.owner
            );

        const tx = await sendTransaction({
          instruction: [instruction],
          signers: [],
          connection,
          wallet,
        });
        console.log(tx);
        setLoading(false);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

  return (
    <TWFWrapper>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.root}>
          <Text style={styles.adminListTitle}>Add admin</Text>
          <TextInput
            style={styles.input}
            onChangeText={setAdmin}
            placeholder={"Admin to add"}
          />
          <Text style={styles.text}>
            Enter the .sol domain or SOL address of the admin to add
          </Text>

          {groupData?.admins.length !== 0 && (
            <View>
              <Text style={styles.adminListTitle}>Current admins</Text>
              {groupData?.admins.map((a, idx) => {
                return (
                  <View key={a.toBase58() + idx}>
                    <AdminRow
                      adminAddress={a.toBase58()}
                      handleOnPress={handleOnPress(false, a.toBase58())}
                    />
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View>
          <TouchableOpacity
            disabled={!admin || loading}
            style={styles.buttonContainer}
            onPress={handleOnPress(true, admin)}
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

export default AddRemoveAdminScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
  },
  root: {
    marginTop: "10%",
  },
  input: {
    backgroundColor: "white",
    padding: 15,
  },
  text: {
    fontSize: 14,
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 20,
    opacity: 0.5,
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
  adminListTitle: {
    textTransform: "uppercase",
    opacity: 0.5,
    marginLeft: 20,
    marginBottom: 5,
    marginTop: 10,
  },
});
