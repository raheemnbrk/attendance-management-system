import { StyleSheet, Text, View } from "react-native";

export default function StartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Punchin</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
});
