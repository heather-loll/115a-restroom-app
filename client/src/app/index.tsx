import { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Text } from "react-native";
import MapView, { Marker, MapMarker} from 'react-native-maps';
import { Plus } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function Index() {
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<MapMarker>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      markerRef.current?.hideCallout();
    }
  }

  const handleMarkerPress = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const handleMarkerDismiss = () => {
    bottomSheetRef.current?.close();
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 36.974943496456206,
          longitude: -122.02797529604096,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsPointsOfInterests={false}
        appleLogoInsets={{ left: 10, top: 10, right: 0, bottom: 0 }}
        legalLabelInsets={{ left: 10, top: 10, right: 0, bottom: 0 }}
        toolbarEnabled={false}
        onPress={handleMarkerDismiss}
      >
        <Marker
          ref={markerRef}
          coordinate={{ latitude: 36.97326466616349, longitude: -122.02507860065315 }}
          pinColor="#009966"
          onPress={(e) => {
            e.stopPropagation();
            handleMarkerPress();
          }}
        />
      </MapView>

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
      >
        <Plus color="#fff" size={24} />
        <Text style={styles.fabText}>Add Restroom</Text>
      </TouchableOpacity>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[150, '35%', '95%']}
        enablePanDownToClose={true}
        onChange={handleSheetChange}
        index={-1}
      >
        <BottomSheetView
          style={styles.sheetContainer}
        >
          <Text style={styles.sheetHeader}>Front & Soquel Restrooms</Text>
          <Text style={styles.sheetSubHeader}>153 Soquel Ave, Santa Cruz, CA</Text>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
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
  },
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    paddingBottom: 36
  },
  sheetHeader: {
    fontWeight: 800,
    fontSize: 24,
    marginBottom: 4
  },
  sheetSubHeader: {
    color: 'gray',
    fontSize: 14
  },
});
