import { useRef, useState, Dispatch, SetStateAction, RefObject, useEffect } from 'react';
import { Alert, StyleSheet } from "react-native";
import MapView, { Marker, MapMarker } from 'react-native-maps';

type PinState = {
  markerRef: RefObject<MapMarker | null> | null;
  restroom: Restroom | null;
} | null;

export default function Map(props: { points: Restroom[], setActiveRestroom: Dispatch<SetStateAction<Restroom | null>> }) {
  const { points, setActiveRestroom } = props;

  const mapRef = useRef<MapView>(null);
  const [activePin, setActivePin] = useState<PinState>(null);

  // Whenever the active pin changes, pipe changes up by setting a new active restroom
  useEffect(() => {
    setActiveRestroom(activePin?.restroom ?? null);
  }, [activePin])

  const handleMarkerDismiss = () => {
    setActivePin({ markerRef: null, restroom: null });
  };

  return (
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
      appleLogoInsets={{ left: 10, bottom: -50, right: 0, top: 0 }}
      legalLabelInsets={{ left: 10, bottom: -50, right: 0, top: 0 }}
      toolbarEnabled={false}
      onPress={handleMarkerDismiss}
    >
      {points.map((restroom) => {
        const markerRef = useRef<MapMarker>(null);
        return (
          <Marker
            ref={markerRef}
            coordinate={{ latitude: restroom.latitude, longitude: restroom.longitude }}
            pinColor="#009966"
            onPress={(e) => {
              e.stopPropagation();
              setActivePin({ markerRef, restroom });
            }}
            key={restroom.restroomId}
          />
        )
      })}
    </MapView>
  )
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
