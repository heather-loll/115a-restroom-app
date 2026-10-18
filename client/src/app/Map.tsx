import { useRef, useState, Dispatch, SetStateAction, RefObject, useEffect } from 'react';
import { Alert, StyleSheet } from "react-native";
import MapView, { Marker, MapMarker } from 'react-native-maps';

type PinState = {
  markerRef: RefObject<MapMarker | null> | null;
  restroom: Restroom | null;
} | null;

export default function Map(props: { points: Restroom[], activeRestroom: Restroom | null, setActiveRestroom: Dispatch<SetStateAction<Restroom | null>> }) {
  const { points, activeRestroom, setActiveRestroom } = props;

  const mapRef = useRef<MapView>(null);
  const [activePin, setActivePin] = useState<PinState>(null);

  // Whenever the active pin changes, pipe changes up by setting a new active restroom
  useEffect(() => {
    setActiveRestroom(activePin?.restroom ?? null);

    if (activePin?.restroom?.longitude === undefined) return;
    if (activePin?.restroom?.latitude === undefined) return;

    // Center map
    mapRef.current?.animateCamera({
      center: {
        longitude: activePin?.restroom.longitude,
        latitude: activePin?.restroom.latitude,
      }
    }, { duration: 1000 });

  }, [activePin])

  const handleMarkerDismiss = () => {
    setActivePin({ markerRef: null, restroom: null });
  };

  // If sheet is dismissed elsewhere, update the active map pin
  useEffect(() => {
    if (activeRestroom === null) {
      handleMarkerDismiss()
    }
  }, [activeRestroom])

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
      zoomEnabled={activeRestroom === null}
      scrollEnabled={activeRestroom === null}
      pitchEnabled={activeRestroom === null}
      rotateEnabled={activeRestroom === null}
      onPress={handleMarkerDismiss}
      // googleMapId={ }
    >
      {points.map((restroom) => {
        const markerRef = useRef<MapMarker>(null);
        return (
          <Marker
            ref={markerRef}
            coordinate={{ latitude: restroom.latitude, longitude: restroom.longitude }}
            pinColor="#009966"
            onSelect={(e) => {
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
