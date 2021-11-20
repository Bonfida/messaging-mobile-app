import React from "react";
import { SafeAreaView, TouchableOpacity } from "react-native";
import { RootStackParamList } from "../App";
import { RouteProp } from "@react-navigation/native";
import { Row } from "../components/Profile/Row";
import { useDisplayName } from "../utils/name-service";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { profileScreenProp } from "../types";

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
        label={displayName[0] + adminTag}
        value={
          <MaterialIcons name="arrow-forward-ios" size={15} color="black" />
        }
      />
    </TouchableOpacity>
  );
};

const GroupMembersScreen = ({
  route,
}: {
  route: RouteProp<RootStackParamList, "Group Members">;
}) => {
  const { members } = route.params;
  return (
    <SafeAreaView>
      {members.map(({ address, isAdmin }, idx) => {
        return (
          <MemberRow key={address + idx} address={address} isAdmin={isAdmin} />
        );
      })}
    </SafeAreaView>
  );
};

export default GroupMembersScreen;
