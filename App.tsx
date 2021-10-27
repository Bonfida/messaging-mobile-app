import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThreadScreen } from "./screens/ThreadScreen";
import EnterSeedScreen from "./screens/EnterSeedScreen";
import SettingsScreen from "./screens/SettingsScreen";
import MessageScreen from "./screens/MessageScreen";
import EditFeeScreen from "./screens/EditFeeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { ConnectionProvider } from "./utils/connection";
import { WalletProvider } from "./utils/wallet";
import { NavigationContainer } from "@react-navigation/native";
import { CacheProvider } from "./utils/cache";

import "./global";

import "react-native-url-polyfill/auto";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <CacheProvider>
      <WalletProvider>
        <ConnectionProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="Messages" component={ThreadScreen} />
              <Stack.Screen name="Message" component={MessageScreen} />
              <Stack.Screen name="Edit Fee" component={EditFeeScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Group screenOptions={{ presentation: "modal" }}>
                <Stack.Screen name="Seed" component={EnterSeedScreen} />
              </Stack.Group>
            </Stack.Navigator>
          </NavigationContainer>
        </ConnectionProvider>
      </WalletProvider>
    </CacheProvider>
  );
}

export default App;
