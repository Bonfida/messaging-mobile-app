import React, { useState } from "react";
import { ScrollView, SafeAreaView, Text, StyleSheet } from "react-native";
import { CachePrefix, useGetAsyncCache } from "../utils/cache";
import MessageRow from "../components/ContactRow";
import { PublicKey } from "@solana/web3.js";
import GlobalStyle from "../Style";

const ArchivedScreen = () => {
  const [refresh, setRefresh] = useState(false);
  const archived = useGetAsyncCache<string[]>(CachePrefix.Archive, refresh);

  const noArchive = !archived || archived?.length === 0;

  if (noArchive) {
    return (
      <SafeAreaView style={styles.root}>
        <Text style={GlobalStyle.darkBlue}>No chat archived</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={GlobalStyle.container}>
      <ScrollView>
        {archived?.map((archive, idx) => {
          return (
            <MessageRow
              key={archive + idx}
              contact={new PublicKey(archive)}
              currentCount={0}
              showArchived
              setRefresh={setRefresh}
            />
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ArchivedScreen;

const styles = StyleSheet.create({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
});
