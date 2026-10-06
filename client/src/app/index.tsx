import { View, StyleSheet, Platform } from "react-native";
import MapView, { Marker } from 'react-native-maps';

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
          title="First restroom!"
          description="This is a description"
        />
      </MapView>
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
  }
});
