import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThreadScreen } from "./screens/ThreadScreen";
import EnterSeedScreen from "./screens/EnterSeedScreen";
import SettingsScreen from "./screens/SettingsScreen.native";
import MessageScreen from "./screens/MessageScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ArchivedScreen from "./screens/ArchivedScreen";
import MessageGroupScreen from "./screens/GroupScreen";
import GroupInfoScreen from "./screens/GroupInfoScreen";
import { ConnectionProvider } from "./utils/connection";
import { WalletProvider } from "./utils/wallet";
import { NavigationContainer } from "@react-navigation/native";
import { ImageZoom } from "./components/ImageZoom";
import { TouchableOpacity } from "react-native";
import { groupMessagesScreenProp } from "./types";
import ExportSeed from "./screens/ExportSeed";
import { RouteProp } from "@react-navigation/native";
import AppInformationScreen from "./screens/AppInformationScreen";
import SelectDisplayDomainNameScreen from "./screens/SelectDisplayDomainNameScreen";
import AppLoading from "expo-app-loading";
import { useFonts } from "expo-font";

import "./global";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import { Feather } from "@expo/vector-icons";

export type RootStackParamList = {
  Messages: undefined;
  Message: { contact: string };
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
  "Change RPC endpoint": undefined;
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

const defaultOptions = { headerTransparent: true, headerTitle: "" };

function App() {
  const [fontsLoaded] = useFonts({
    "Rota-Regular": require("./assets/Rota-Regular.otf"),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <ConnectionProvider>
      <WalletProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Messages"
              component={ThreadScreen}
              options={defaultOptions}
            />
            <Stack.Screen name="Message" component={MessageScreen} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={defaultOptions}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={defaultOptions}
            />
            <Stack.Screen
              name="Archived"
              component={ArchivedScreen}
              options={defaultOptions}
            />
            <Stack.Screen
              name="Export Seeds"
              component={ExportSeed}
              options={defaultOptions}
            />
            <Stack.Screen
              name="Media"
              component={ImageZoom}
              options={defaultOptions}
            />
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
            <Stack.Screen
              name="Group Info"
              component={GroupInfoScreen}
              options={defaultOptions}
            />
            <Stack.Screen
              name="App Information"
              component={AppInformationScreen}
              options={defaultOptions}
            />
            <Stack.Screen
              name="Select Display Domain"
              component={SelectDisplayDomainNameScreen}
              options={defaultOptions}
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
