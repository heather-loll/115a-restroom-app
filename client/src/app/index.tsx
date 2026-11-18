import { useEffect, useState, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { getUserLocation } from '../utils/location';
import Map from '../components/Map';

import BottomNav from '../components/BottomNav';
import RestroomInfoSheet from '../components/RestroomInfoSheet';

import { API_getRestrooms } from '../utils/api';

export default function Index() {
  const [activeRestroom, setActiveRestroom] = useState<Restroom | null>(null);
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);

  useEffect(() => {
    (async () => {
      const { longitude, latitude } = await getUserLocation();
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
      />

      <BottomNav />

      <RestroomInfoSheet restroom={activeRestroom} setActiveRestroom={setActiveRestroom} />
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
