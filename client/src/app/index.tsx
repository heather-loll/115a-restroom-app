import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker, Callout } from 'react-native-maps';
import { Plus } from 'lucide-react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={{
        latitude: 36.974943496456206,
        longitude: -122.02797529604096,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }}
      >
        <Marker
          coordinate={{ latitude: 36.97326466616349, longitude: -122.02507860065315 }}
          pinColor="#009966"
        >
          <Callout>
            <View>
              <Text>This is a restroom.</Text>
            </View>
          </Callout>
        </Marker>
      </MapView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
      >
        <Plus color="#fff" size={24} />
        <Text style={styles.fabText}>Add Restroom</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    right: 20,
    bottom: 40,
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
  fabText: {
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: 600
  }
});
