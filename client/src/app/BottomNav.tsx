import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Plus, Settings, ListFilter } from 'lucide-react-native';

export default function Fab() {
  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.settings}
          activeOpacity={0.8}
        >
          <Settings color="#fff" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filter}
          activeOpacity={0.8}
        >
          <ListFilter color="#fff" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.add}
          activeOpacity={0.8}
        >
          <Plus color="#fff" size={24} />
          <Text style={styles.addText}>Add Restroom</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    paddingInline: 20,
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
  },
  settings: {
    height: 52,
    width: 52,
    display: 'flex',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray",
    borderRadius: 26
  },
  filter: {
    height: 52,
    width: 52,
    display: 'flex',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#009966',
    borderRadius: 26
  },
  add: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009966',
    borderRadius: 32,
    elevation: 8, // Shadows for Android
    shadowColor: '#000', // Shadows for iOS
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    paddingInline: 16,
    gap: 8
  },
  addText: {
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: 600
  },
});
