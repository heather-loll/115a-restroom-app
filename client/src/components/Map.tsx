import { useRef, useState, Dispatch, SetStateAction, useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
// import MapView from 'react-native-map-clustering';
import MapView, { Marker, MapMarker } from 'react-native-maps';
import type RNMapView from 'react-native-maps';
import * as Haptics from 'expo-haptics';

import { useCurrentMapLocationStore, useSelectingLocationToCreateStore } from '../utils/stores';
import { amenityFilters } from './FilterSheet';

type PinState = {
  markerId: string | null;
  restroom: Restroom | null;
} | null;

function amenityFilter(amenities: AmenitiesList, filter: amenityFilters) {
  //if filter amenity true then, amenity in amenitieslist has to be true
  const keys = Object.keys(filter) as (keyof amenityFilters)[];
  return keys.every(key => amenities?.[key] || !filter?.[key]);
}

function pointFilter(points: Restroom[], filter: amenityFilters) {
  const filteredPoints = points.filter(point => {
    return amenityFilter(point.amenities, filter);
  });
  return filteredPoints;
}

interface MapProps {
  points: Restroom[];
  activeRestroom: Restroom | null;
  setActiveRestroom: Dispatch<SetStateAction<Restroom | null>>;
  amenitiesApplied: amenityFilters;
}

export default function Map({
  points,
  activeRestroom,
  setActiveRestroom,
  amenitiesApplied,
}: MapProps) {
  const [selectingLocation] = useSelectingLocationToCreateStore();
  const [, setCurrentMapLocation] = useCurrentMapLocationStore();

  const mapRef = useRef<RNMapView>(null);
  const [activePin, setActivePin] = useState<PinState>(null);
  const markerRefs = useRef<{ [key: string]: MapMarker | null }>({});

  const MAP_PADDING = Platform.OS === 'ios' ? 100 : 0;

  // Whenever the active pin changes, pipe changes up by setting a new active restroom
  useEffect(() => {
    setActiveRestroom(activePin?.restroom ?? null);

    if (activePin?.restroom) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (activePin?.restroom?.longitude === undefined) return;
    if (activePin?.restroom?.latitude === undefined) return;

    // Center map
    mapRef.current?.animateCamera(
      {
        center: {
          longitude: activePin?.restroom.longitude,
          latitude: activePin?.restroom.latitude,
        },
      },
      { duration: 1000 },
    );
  }, [activePin]);

  const handleMarkerDismiss = () => {
    if (activePin?.markerId && markerRefs.current[activePin.markerId]) {
      markerRefs.current[activePin.markerId]?.hideCallout();
    }

    setActivePin(null);
  };

  // If sheet is dismissed elsewhere, update the active map pin
  useEffect(() => {
    if (activeRestroom === null) {
      handleMarkerDismiss();
    }
  }, [activeRestroom]);

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
      showsUserLocation={true}
      mapPadding={{
        top: 0,
        left: 0,
        right: 0,
        bottom: activePin ? MAP_PADDING : 0,
      }}
      onRegionChangeComplete={({ longitude, latitude }) => {
        setCurrentMapLocation({ longitude, latitude });
      }}
      appleLogoInsets={{ top: -100, left: -100, right: 0, bottom: activePin ? -MAP_PADDING : 0 }}
      legalLabelInsets={{ top: -100, left: -100, right: 0, bottom: activePin ? -MAP_PADDING : 0 }}
      showsPointsOfInterests={selectingLocation}
      toolbarEnabled={false}
      zoomEnabled={activeRestroom === null}
      scrollEnabled={activeRestroom === null}
      pitchEnabled={activeRestroom === null}
      rotateEnabled={activeRestroom === null}
      onPress={handleMarkerDismiss}>
      {!selectingLocation &&
        pointFilter(points, amenitiesApplied).map(restroom => {
          const handleOpenPin = (e: any) => {
            e.stopPropagation();
            setActivePin({ markerId: restroom.restroomId, restroom });
          };

          return (
            <Marker
              ref={e => {
                markerRefs.current[restroom.restroomId] = e;
              }}
              coordinate={{
                latitude: restroom.latitude,
                longitude: restroom.longitude,
              }}
              // No animation on android for selected pin so we change the color!
              pinColor={
                activePin?.markerId === restroom.restroomId && Platform.OS === 'android'
                  ? '#ffffff'
                  : '#009966'
              }
              zIndex={activePin?.markerId === restroom.restroomId ? 999 : 1}
              onSelect={handleOpenPin}
              onPress={handleOpenPin}
              onDeselect={() => {
                if (activePin?.markerId === restroom.restroomId) {
                  handleMarkerDismiss();
                }
              }}
              key={restroom.restroomId}
            />
          );
        })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
  blur: {
    width: '100%',
    height: 150,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: undefined,
  },
});
