import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThreadScreen } from "./screens/ThreadScreen";
import EnterSeedScreen from "./screens/EnterSeedScreen";
import SettingsScreen from "./screens/SettingsScreen";
import MessageScreen from "./screens/MessageScreen";
import EditFeeScreen from "./screens/EditFeeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ArchivedScreen from "./screens/ArchivedScreen";
import { ConnectionProvider } from "./utils/connection";
import { WalletProvider } from "./utils/wallet";
import { NavigationContainer } from "@react-navigation/native";

import "./global";
import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

export type RootStackParamList = {
  Messages: undefined;
  Message: { contact: string };
  "Edit Fee": undefined;
  Settings: undefined;
  Profile: { contact: string };
  Archived: undefined;
  Seed: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <WalletProvider>
      <ConnectionProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Messages" component={ThreadScreen} />
            <Stack.Screen name="Message" component={MessageScreen} />
            <Stack.Screen name="Edit Fee" component={EditFeeScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Archived" component={ArchivedScreen} />
            <Stack.Group screenOptions={{ presentation: "modal" }}>
              <Stack.Screen name="Seed" component={EnterSeedScreen} />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
      </ConnectionProvider>
    </WalletProvider>
  );
}

export default App;
