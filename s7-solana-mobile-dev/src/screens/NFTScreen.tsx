import {
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Linking,
  View,
  TouchableOpacity,
} from "react-native";
import { CLUSTER, useAuthorization } from "../utils/useAuthorization";
import { useGetTokenAccounts } from "../components/account/account-data-access";
import { PublicKey } from "@solana/web3.js";

export function NFTScreen() {
  const { selectedAccount } = useAuthorization();
  const { data: tokenAccounts, isLoading } = useGetTokenAccounts({
    address: selectedAccount?.publicKey ?? PublicKey.default,
  });

  if (!selectedAccount) {
    return null;
  }

  const openExplorer = (pubkey: string) => {
    const url = `https://explorer.solana.com/address/${pubkey}?cluster=${CLUSTER}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.screenContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color="purple" />
      ) : tokenAccounts?.length ?? 0 > 0 ? (
        <View>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Public Key</Text>
            <Text style={styles.headerCell}>Explorer</Text>
          </View>
          {tokenAccounts?.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.cell}>{item.pubkey.toString()}</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => openExplorer(item.pubkey.toString())}
              >
                <Text style={styles.buttonText}>View</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noAccountsText}>No token accounts found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    flex: 1,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  headerCell: {
    fontWeight: "bold",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: {
    flex: 1,
  },
  button: {
    backgroundColor: "purple",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  noAccountsText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
    color: "gray",
  },
});
