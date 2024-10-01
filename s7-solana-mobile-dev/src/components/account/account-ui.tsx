import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  useGetBalance,
  useGetTokenAccountBalance,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from "./account-data-access";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useState, useMemo } from "react";
import { ellipsify } from "../../utils/ellipsify";
import { AppModal } from "../ui/app-modal";

const lamportsToSol = (balance: number) =>
  Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000;

interface AddressProps {
  address: PublicKey;
}

export const AccountBalance: React.FC<AddressProps> = ({ address }) => {
  const { data } = useGetBalance({ address });
  return (
    <View style={styles.accountBalance}>
      <Text style={styles.titleMedium}>Current Balance</Text>
      <Text style={styles.displayLarge}>
        {data ? lamportsToSol(data) : "..."} SOL
      </Text>
    </View>
  );
};

export const AccountButtonGroup: React.FC<AddressProps> = ({ address }) => {
  const requestAirdrop = useRequestAirdrop({ address });
  const [showModal, setShowModal] = useState<
    "airdrop" | "send" | "receive" | null
  >(null);

  const modalProps = {
    address,
    show: showModal !== null,
    hide: () => setShowModal(null),
  };

  return (
    <View style={styles.accountButtonGroup}>
      {showModal === "airdrop" && <AirdropRequestModal {...modalProps} />}
      {showModal === "send" && <TransferSolModal {...modalProps} />}
      {showModal === "receive" && <ReceiveSolModal {...modalProps} />}
      <TouchableOpacity
        style={[
          styles.button,
          requestAirdrop.isPending && styles.disabledButton,
        ]}
        onPress={() => setShowModal("airdrop")}
        disabled={requestAirdrop.isPending}
      >
        <Text style={styles.buttonText}>Airdrop</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.buttonMargin]}
        onPress={() => setShowModal("send")}
      >
        <Text style={styles.buttonText}>Send</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.buttonMargin]}
        onPress={() => setShowModal("receive")}
      >
        <Text style={styles.buttonText}>Receive</Text>
      </TouchableOpacity>
    </View>
  );
};

interface ModalProps extends AddressProps {
  hide: () => void;
  show: boolean;
}

export const AirdropRequestModal: React.FC<ModalProps> = ({
  hide,
  show,
  address,
}) => {
  const requestAirdrop = useRequestAirdrop({ address });

  return (
    <AppModal
      title="Request Airdrop"
      hide={hide}
      show={show}
      submit={() => requestAirdrop.mutateAsync(1).catch(console.error)}
      submitLabel="Request"
      submitDisabled={requestAirdrop.isPending}
    >
      <Text>Request an airdrop of 1 SOL to your connected wallet account.</Text>
    </AppModal>
  );
};

export const TransferSolModal: React.FC<ModalProps> = ({
  hide,
  show,
  address,
}) => {
  const transferSol = useTransferSol({ address });
  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");

  return (
    <AppModal
      title="Send SOL"
      hide={hide}
      show={show}
      submit={() => {
        transferSol
          .mutateAsync({
            destination: new PublicKey(destinationAddress),
            amount: parseFloat(amount),
          })
          .then(hide);
      }}
      submitLabel="Send"
      submitDisabled={!destinationAddress || !amount}
    >
      <View style={styles.modalContent}>
        <TextInput
          placeholder="Amount (SOL)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Destination Address"
          value={destinationAddress}
          onChangeText={setDestinationAddress}
          style={styles.input}
        />
      </View>
    </AppModal>
  );
};

export const ReceiveSolModal: React.FC<ModalProps> = ({
  hide,
  show,
  address,
}) => (
  <AppModal title="Receive assets" hide={hide} show={show}>
    <Text selectable>
      You can receive assets by sending them to your public key:
      {"\n\n"}
      <Text style={styles.boldText}>{address.toBase58()}</Text>
    </Text>
  </AppModal>
);

export const AccountTokens: React.FC<AddressProps> = ({ address }) => {
  const { data, isLoading, isError, error } = useGetTokenAccounts({ address });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const items = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return data?.slice(start, end) ?? [];
  }, [data, currentPage]);

  const numberOfPages = useMemo(
    () => Math.ceil((data?.length ?? 0) / itemsPerPage),
    [data]
  );

  return (
    <>
      <Text style={styles.titleMedium}>Token Accounts</Text>
      <ScrollView>
        {isLoading && <ActivityIndicator />}
        {isError && <Text style={styles.error}>Error: {error?.message}</Text>}
        {!isLoading && !isError && (
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderCell}>Public Key</Text>
              <Text style={styles.tableHeaderCell}>Mint</Text>
              <Text style={[styles.tableHeaderCell, styles.rightAlign]}>
                Balance
              </Text>
            </View>

            {items.length === 0 ? (
              <Text style={styles.noTokens}>No token accounts found.</Text>
            ) : (
              items.map(({ account, pubkey }) => (
                <View key={pubkey.toString()} style={styles.tableRow}>
                  <Text style={styles.tableCell}>
                    {ellipsify(pubkey.toString())}
                  </Text>
                  <Text style={styles.tableCell}>
                    {ellipsify(account.data.parsed.info.mint)}
                  </Text>
                  <View style={[styles.tableCell, { alignItems: "flex-end" }]}>
                    <AccountTokenBalance address={pubkey} />
                  </View>
                </View>
              ))
            )}

            {(data?.length ?? 0) > itemsPerPage && (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentPage((prev) => Math.max(0, prev - 1))
                  }
                  disabled={currentPage === 0}
                >
                  <Text style={styles.paginationButton}>Previous</Text>
                </TouchableOpacity>
                <Text>{`${currentPage + 1} of ${numberOfPages}`}</Text>
                <TouchableOpacity
                  onPress={() =>
                    setCurrentPage((prev) =>
                      Math.min(numberOfPages - 1, prev + 1)
                    )
                  }
                  disabled={currentPage === numberOfPages - 1}
                >
                  <Text style={styles.paginationButton}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
};

export const AccountTokenBalance: React.FC<AddressProps> = ({ address }) => {
  const { data, isLoading } = useGetTokenAccountBalance({ address });
  if (isLoading) return <ActivityIndicator />;
  return data ? <Text>{data.value.uiAmount}</Text> : <Text>Error</Text>;
};

const styles = StyleSheet.create({
  accountBalance: {
    marginTop: 12,
  },
  titleMedium: {
    fontSize: 16,
    fontWeight: "bold",
  },
  displayLarge: {
    fontSize: 24,
    fontWeight: "bold",
  },
  accountButtonGroup: {
    paddingVertical: 4,
    flexDirection: "row",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonMargin: {
    marginLeft: 6,
  },
  error: {
    padding: 8,
    color: "red",
  },
  modalContent: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  noTokens: {
    marginTop: 12,
  },
  boldText: {
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 10,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  tableCell: {
    flex: 1,
  },
  rightAlign: {
    textAlign: "right",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  paginationButton: {
    color: "#007AFF",
  },
});
