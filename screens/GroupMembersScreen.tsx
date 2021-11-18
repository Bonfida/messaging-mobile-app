import React from "react";
import { SafeAreaView, TouchableOpacity } from "react-native";
import { RootStackParamList } from "../App";
import { RouteProp } from "@react-navigation/native";
import { Row } from "../components/Profile/Row";
import { useDisplayName } from "../utils/name-service";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { profileScreenProp } from "../types";

const MemberRow = ({ address }: { address: string }) => {
  const [displayName] = useDisplayName(address);
  const navigation = useNavigation<profileScreenProp>();

  if (!displayName) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Profile", { contact: address })}
    >
      <Row
        label={displayName[0]}
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
      {members.map((m, idx) => {
        return <MemberRow key={m + idx} address={m} />;
      })}
    </SafeAreaView>
  );
};

export default GroupMembersScreen;
