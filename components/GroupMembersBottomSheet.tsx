import React from "react";
import {
  TextInput,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { BottomSheet } from "react-native-btr";
import GlobalStyle from "../Style";
import { formatDisplayName } from "../utils/utils.native";
import { useNavigation } from "@react-navigation/native";
import { useDisplayName } from "../utils/name-service";
import { profileScreenProp } from "../types";
import { Row } from "../components/Profile/Row";
import { MaterialIcons } from "@expo/vector-icons";

const Title = ({ title, total }: { title: string; total: number }) => {
  return (
    <View style={styles.title}>
      <Text style={styles.h2}>
        {title} - {total}
      </Text>
    </View>
  );
};

const MemberRow = ({
  address,
  isAdmin,
}: {
  address: string;
  isAdmin: boolean;
}) => {
  const [displayName] = useDisplayName(address);
  const navigation = useNavigation<profileScreenProp>();

  if (!displayName) {
    return null;
  }

  const adminTag = isAdmin ? " - Admin" : "";
  console.log(isAdmin);
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Profile", { contact: address })}
    >
      <Row
        label={formatDisplayName(displayName[0]) + adminTag}
        value={
          <MaterialIcons name="arrow-forward-ios" size={15} color="black" />
        }
      />
    </TouchableOpacity>
  );
};

const GroupMembersBottomSheet = ({
  visible,
  setVisible,
  members,
}: {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  members: { address: string; isAdmin: boolean }[] | undefined;
}) => {
  return (
    <BottomSheet
      visible={visible}
      onBackButtonPress={() => setVisible(false)}
      onBackdropPress={() => setVisible(false)}
    >
      <View style={styles.bottomNavigationView}>
        <View style={styles.container}>
          <Title title="Group members" total={members?.length || 0} />
          <ScrollView>
            {members?.map(({ address, isAdmin }, idx) => {
              return (
                <MemberRow
                  key={address + idx}
                  address={address}
                  isAdmin={isAdmin}
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </BottomSheet>
  );
};

export default GroupMembersBottomSheet;

const styles = StyleSheet.create({
  bottomNavigationView: {
    width: "100%",
    height: "90%",
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
});
