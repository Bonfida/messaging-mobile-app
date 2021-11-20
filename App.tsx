import React, { useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThreadScreen } from "./screens/ThreadScreen";
import EnterSeedScreen from "./screens/EnterSeedScreen";
import SettingsScreen from "./screens/SettingsScreen";
import MessageScreen from "./screens/MessageScreen";
import EditFeeScreen from "./screens/EditFeeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ArchivedScreen from "./screens/ArchivedScreen";
import CreateGroupScreen from "./screens/CreateGroupScreen";
import MessageGroupScreen from "./screens/GroupScreen";
import GroupInfoScreen from "./screens/GroupInfoScreen";
import AddRemoveAdminScreen from "./screens/AddRemoveAdminScreen";
import { ConnectionProvider } from "./utils/connection";
import { WalletProvider } from "./utils/wallet";
import { NavigationContainer } from "@react-navigation/native";
import { ImageZoom } from "./components/ImageZoom";
import { TouchableOpacity } from "react-native";
import CreateThreadModal from "./components/CreateThreadModal";
import { messagesScreenProp, groupMessagesScreenProp } from "./types";
import ExportSeed from "./screens/ExportSeed";
import { Platform, StyleSheet, View } from "react-native";
import Modal from "./components/Modal";
import { RouteProp } from "@react-navigation/native";
import AppInformationScreen from "./screens/AppInformationScreen";
import GroupMembersScreen from "./screens/GroupMembersScreen";
import SelectDisplayDomainNameScreen from "./screens/SelectDisplayDomainNameScreen";

import "./global";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import { Entypo, Feather } from "@expo/vector-icons";

const styles = StyleSheet.create({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  item: {
    marginRight: 20,
  },
});

export type RootStackParamList = {
  Messages: undefined;
  Message: { contact: string };
  "Edit Fee": { groupKey?: string };
  Settings: undefined;
  Profile: { contact: string };
  Archived: undefined;
  Seed: undefined;
  Media: { uri: string };
  "Export Seeds": undefined;
  "Create Group": undefined;
  "Group Messages": { group: string; name: string };
  "Group Info": { group: string };
  "Edit Admins": { group: string };
  "App Information": undefined;
  "Group Members": { members: { address: string; isAdmin: boolean }[] };
  "Select Display Domain": { selectedDomain: string | undefined };
};

const HeaderLeft = ({ iconSize }: { iconSize: number }) => {
  const [visible, setVisible] = useState(false);
  return (
    <TouchableOpacity onPress={() => setVisible(true)}>
      <Entypo name="new-message" size={iconSize} color="#007bff" />
      {visible && (
        <Modal animationType="slide" transparent={false} visible={visible}>
          <CreateThreadModal setVisible={setVisible} />
        </Modal>
      )}
    </TouchableOpacity>
  );
};

const HeaderRight = ({
  navigation,
  iconSize,
}: {
  navigation: messagesScreenProp;
  iconSize: number;
}) => {
  return (
    <>
      <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
        <Feather name="settings" size={iconSize} color="#007bff" />
      </TouchableOpacity>
    </>
  );
};

const HeaderWeb = ({ navigation }: { navigation: messagesScreenProp }) => {
  return (
    <View style={styles.header}>
      <View style={styles.item}>
        <HeaderLeft iconSize={30} />
      </View>
      <View style={styles.item}>
        <HeaderRight navigation={navigation} iconSize={30} />
      </View>
    </View>
  );
};

const HeaderRightGroup = ({
  navigation,
  route,
}: {
  navigation: groupMessagesScreenProp;
  route: RouteProp<RootStackParamList, "Group Messages">;
}) => {
  const { group } = route.params;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Group Info", { group })}
    >
      <Feather name="info" size={24} color="black" />
    </TouchableOpacity>
  );
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const isMobile = Platform.OS !== "web";
  return (
    <ConnectionProvider>
      <WalletProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Messages"
              component={ThreadScreen}
              options={({ navigation }) => ({
                headerRight: () =>
                  isMobile ? (
                    <HeaderLeft iconSize={20} />
                  ) : (
                    <HeaderWeb navigation={navigation} />
                  ),
                headerLeft: () =>
                  isMobile && (
                    <HeaderRight iconSize={20} navigation={navigation} />
                  ),
              })}
            />
            <Stack.Screen name="Message" component={MessageScreen} />
            <Stack.Screen name="Edit Fee" component={EditFeeScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Archived" component={ArchivedScreen} />
            <Stack.Screen name="Export Seeds" component={ExportSeed} />
            <Stack.Screen name="Media" component={ImageZoom} />
            <Stack.Screen name="Create Group" component={CreateGroupScreen} />
            <Stack.Screen
              name="Group Messages"
              component={MessageGroupScreen}
              options={({ route, navigation }) => ({
                title: route.params.name,
                headerRight: () => (
                  <HeaderRightGroup navigation={navigation} route={route} />
                ),
              })}
            />
            <Stack.Screen name="Group Info" component={GroupInfoScreen} />
            <Stack.Screen name="Edit Admins" component={AddRemoveAdminScreen} />
            <Stack.Screen
              name="App Information"
              component={AppInformationScreen}
            />
            <Stack.Screen name="Group Members" component={GroupMembersScreen} />
            <Stack.Screen
              name="Select Display Domain"
              component={SelectDisplayDomainNameScreen}
            />
            <Stack.Group screenOptions={{ presentation: "modal" }}>
              <Stack.Screen name="Seed" component={EnterSeedScreen} />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
