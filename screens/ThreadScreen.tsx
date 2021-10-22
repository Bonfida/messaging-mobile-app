import React, { useState, useMemo } from "react";
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
import MessageRow from "../components/MessageRow";
import { useWallet } from "../utils/wallet";
import CreateThreadModal from "../components/CreateThreadModal";

export const ThreadScreen = () => {
  const [refresh, setRefresh] = useState(false);
  const [visible, setVisibile] = useState(false);
  const { wallet } = useWallet();
  const [threads, threadsLoading] = useUserThread(refresh);
  const navigation = useNavigation();

  const handleOnRefresh = () => {
    setRefresh((prev) => !prev);
  };

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
            />
          );
        })}
      </>
    );
  }, [threads?.length]);

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={threadsLoading}
            onRefresh={handleOnRefresh}
          />
        }
      >
        <View>{memoizedThread}</View>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
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
      </ScrollView>
      <Modal animationType="slide" transparent={false} visible={visible}>
        <CreateThreadModal setVisible={setVisibile} />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaView: { height: "100%" },
  scrollView: {
    flex: 1,
    height: "100%",
    justifyContent: "space-between",
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
});
