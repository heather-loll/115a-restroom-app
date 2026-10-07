import { useRef } from 'react';
import { StyleSheet, Text } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker, MapMarker} from 'react-native-maps';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import BottomNav from "./BottomNav"

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
    bottomSheetRef.current?.snapToIndex(2);
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

      <BottomNav />

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={[250, '35%', '95%']}
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
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    paddingBottom: 36,
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
