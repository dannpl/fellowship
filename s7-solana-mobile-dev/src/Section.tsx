import { ReactNode } from "react";
import { StyleSheet, View, Text } from "react-native";

export const Section: React.FC<{
  children?: ReactNode;
  description?: string;
  title?: string;
}> = ({ children, description, title }) => {
  return (
    <View style={styles.sectionContainer}>
      {title ? <Text style={styles.titleText}>{title}</Text> : null}
      {description ? (
        <Text style={styles.descriptionText}>{description}</Text>
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  titleText: {
    fontWeight: "bold",
  },
  descriptionText: {
    fontSize: 16,
  },
  sectionContainer: {
    marginTop: 18,
  },
  childrenContainer: {
    alignItems: "center",
    flexDirection: "row",
  },
});
