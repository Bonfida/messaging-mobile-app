import React, { useState, useMemo, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Modal,
} from "react-native";
import { useUserThread } from "../utils/jabber";
import { useNavigation } from "@react-navigation/native";
import MessageRow from "../components/ContactRow";
import { useWallet } from "../utils/wallet";
import CreateThreadModal from "../components/CreateThreadModal";
import { CachePrefix, useGetAsyncCache } from "../utils/cache";
import { settingsScreenProp } from "../types";

export const ThreadScreen = () => {
  const [refresh, setRefresh] = useState(false);
  const [visible, setVisibile] = useState(false);
  const { wallet } = useWallet();
  const [threads, threadsLoading] = useUserThread(refresh);
  const navigation = useNavigation<settingsScreenProp>();
  const [archived] = useGetAsyncCache(CachePrefix.Archive, false, 1_000);

  const handleOnRefresh = () => {
    setRefresh((prev) => !prev);
  };

  useEffect(() => {
    if (!wallet) {
      navigation.navigate("Settings");
    }
  });

  const memoizedThread = useMemo(() => {
    return (
      <>
        {threads?.map((thread) => {
          if (!thread) return null;
          return (
            <MessageRow
              key={`thread-${thread.user1.toBase58()}-${thread.user2.toBase58()}`}
              contact={
                wallet?.publicKey.equals(thread?.user1)
                  ? thread?.user2
                  : thread?.user1
              }
              currentCount={thread.msgCount}
              archived={archived}
            />
          );
        })}
      </>
    );
  }, [threads?.length, archived?.length]);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={threadsLoading}
            onRefresh={handleOnRefresh}
          />
        }
      >
        <View>{memoizedThread}</View>
      </ScrollView>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => setVisibile(true)}
        >
          <Text style={styles.buttonText}>New Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={() => navigation.navigate("Settings")}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
      </View>
      <Modal animationType="slide" transparent={false} visible={visible}>
        <CreateThreadModal setVisible={setVisibile} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaView: {
    height: "100%",
  },
  root: {
    flex: 1,
    flexDirection: "column",
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
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
    alignSelf: "center",
    textTransform: "uppercase",
  },
  container: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
