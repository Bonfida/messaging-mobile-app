import React, { useState } from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  ImageProps,
  ScrollView,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import { useKeyBoardOffset } from "../utils/utils.native";
import { useWallet } from "../utils/wallet.native";
import BlueButton from "./Buttons/BlueGradient";
import { useGroupData } from "../utils/jabber";
import { balanceWarning } from "../components/BalanceWarning";
import { isWeb } from "../utils/utils";
import { PublicKey } from "@solana/web3.js";
import { validateInput } from "../utils/utils.native";
import { getHashedName, getNameAccountKey } from "../utils/web3/name-service";
import { SOL_TLD_AUTHORITY } from "../utils/name-service";
import {
  getTwitterRegistry,
  NameRegistryState,
} from "@bonfida/spl-name-service";
import { useConnection } from "../utils/connection";
import { addAdminToGroup, removeAdminFromGroup } from "@bonfida/jabber";
import { useNavigation } from "@react-navigation/native";
import { useDisplayName } from "../utils/name-service";
import { abbreviateAddress } from "../utils/utils.native";
import { MaterialIcons } from "@expo/vector-icons";
import { profileScreenProp } from "../types";
import { Row } from "../components/Profile/Row";

enum Step {
  Menu,
  AdminList,
  AddAdmin,
}

const Title = ({ title }: { title: string }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>{title}</Text>
    </View>
  );
};

const MeuRow = ({
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

const AdminRow = ({
  adminAddress,
  handleOnPress,
  close,
}: {
  adminAddress: string;
  handleOnPress: () => Promise<void>;
  close: () => void;
}) => {
  const [displayName] = useDisplayName(adminAddress);
  const navigation = useNavigation<profileScreenProp>();

  const handleOnPressGo = () => {
    close();
    navigation.navigate("Profile", { contact: adminAddress });
  };

  if (!displayName) {
    return null;
  }
  return (
    <TouchableOpacity onPress={handleOnPressGo}>
      <Row
        label={`${displayName[0]} (${abbreviateAddress(adminAddress)})`}
        value={
          <TouchableOpacity style={{ paddingTop: 5 }} onPress={handleOnPress}>
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        }
      />
    </TouchableOpacity>
  );
};

const ManageAdminBottomSheet = ({
  visible,
  setVisible,
  group,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  group: string;
}) => {
  const keyboardOffset = useKeyBoardOffset();
  const [loading, setLoading] = useState(false);
  const { wallet, sendTransaction, hasSol } = useWallet();
  const [step, setStep] = useState(Step.Menu);
  const [admin, setAdmin] = useState<string | null>(null);
  const groupData = useGroupData(group);
  const connection = useConnection();

  const close = () => {
    setStep(Step.Menu);
    setVisible(false);
  };

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
        close();
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
    };

  return (
    <BottomSheet
      visible={visible}
      onBackButtonPress={close}
      onBackdropPress={close}
    >
      <View
        style={[
          styles.bottomNavigationView,
          {
            marginBottom: keyboardOffset,
            height: step === Step.AdminList ? "90%" : 250,
          },
        ]}
      >
        {step === Step.Menu && (
          <View style={styles.container}>
            <Title title="Manage admins" />
            <MeuRow
              icon={require("../assets/new-dm.png")}
              label="Add new admin"
              handleOnPress={() => setStep(Step.AddAdmin)}
            />
            <MeuRow
              icon={require("../assets/new-group.png")}
              label="Manage admins"
              handleOnPress={() => setStep(Step.AdminList)}
            />
          </View>
        )}
        {step === Step.AddAdmin && (
          <View style={styles.container}>
            <Title title="Add admin" />
            <Text style={[GlobalStyle.text, { marginTop: 20 }]}>
              Enter the domain of your contact e.g. bonfida.sol
            </Text>
            <TextInput
              autoCapitalize="none"
              style={styles.textInput}
              placeholder="New admin address or .sol domain"
              placeholderTextColor="#C8CCD6"
              onChangeText={setAdmin}
            />
            <View style={styles.button}>
              <BlueButton
                borderRadius={28}
                width={120}
                height={56}
                onPress={handleOnPress(true, admin)}
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
        )}
        {step === Step.AdminList && (
          <View style={styles.container}>
            <Title title="Admin list" />
            <ScrollView>
              {groupData?.admins.length !== 0 && (
                <View>
                  {groupData?.admins.map((a, idx) => {
                    return (
                      <View key={a.toBase58() + idx}>
                        <AdminRow
                          adminAddress={a.toBase58()}
                          handleOnPress={handleOnPress(false, a.toBase58())}
                          close={close}
                        />
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </BottomSheet>
  );
};

export default ManageAdminBottomSheet;

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",

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
    width: "90%",
    marginLeft: "5%",
    marginRight: "5%",
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
});
