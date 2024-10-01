import { StyleSheet, View, Text } from "react-native";

export default function BlankScreen() {
  return (
    <>
      <View style={styles.screenContainer}>
        <Text>This is a blank tab!</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    height: "100%",
    padding: 16,
  },
});
