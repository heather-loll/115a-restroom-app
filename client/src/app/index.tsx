import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toaster } from 'sonner-native';

import { amenityFilters } from '../components/FilterSheet';
import Map from '../components/Map';
import { DEFAULT_COORDS } from '../utils/location';

import BottomNav from '../components/BottomNav';
import RestroomInfoSheet from '../components/RestroomInfoSheet';

import { API_getRestrooms } from '../utils/api';

export default function Index() {
  const [activeRestroom, setActiveRestroom] = useState<Restroom | null>(null);
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);
  const [amenitiesApplied, setAmenitiesApplied] = useState<amenityFilters>({
    paymentRequired: false,
    accessible: false,
    unisex: false,
    singleOccupancy: false,
    menstrualProductsAvailible: false,
    babyChangingStation: false,
  });

  useEffect(() => {
    (async () => {
      // const { longitude, latitude } = await getUserLocation();
      const { longitude, latitude } = DEFAULT_COORDS;
      const data = await API_getRestrooms(longitude, latitude, 5000);
      setRestrooms(data);
    })();

    // Add placeholder restrooms since API isnt up yet
    setRestrooms([
      ...restrooms,
      {
        restroomId: 's',
        name: 'Front & Soquel Restrooms',
        address: '315 Front Street, Santa Cruz, CA',
        latitude: 36.97326466616349,
        longitude: -122.02507860065315,
        amenities: {
          cleanliness: 1.3,
          unisex: true,
          singleOccupancy: true,
          babyChangingStation: false,
        },
      },
      {
        restroomId: 'constance',
        name: 'Pleasure Pizza',
        address: '1415 Pacific Ave, Santa Cruz, CA',
        latitude: 36.975188,
        longitude: -122.026669,
        amenities: {
          unisex: true,
          singleOccupancy: true,
          babyChangingStation: true,
          paymentRequired: true,
          menstrualProductsAvailible: true,
        },
      },
    ]);
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <Map
        points={restrooms}
        activeRestroom={activeRestroom}
        setActiveRestroom={setActiveRestroom}
        amenitiesApplied={amenitiesApplied}
      />

      <BottomNav amenitiesApplied={amenitiesApplied} setAmenitiesApplied={setAmenitiesApplied} />

      <RestroomInfoSheet restroom={activeRestroom} setActiveRestroom={setActiveRestroom} />

      <Toaster
        position="bottom-center"
        theme="dark"
        toastOptions={{
          toastContentStyle: {
            alignItems: 'center', // Vertically centers the icon with the row
          },
          textContainerStyle: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flex: 1,
            gap: 12,
          },
          titleStyle: {
            flex: 1, // Allows long text to wrap instead of pushing the button off-screen
          },
          buttonsStyle: {
            marginTop: 0, // Removes default top spacing meant for stacked buttons
          },
        }}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
