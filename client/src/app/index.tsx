import { useEffect, useState, useContext } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { getUserLocation } from '../utils/location';

import Map from '../components/Map';
import BottomNav from '../components/BottomNav';
import RestroomInfoSheet from '../components/RestroomInfoSheet';

import { API_getRestrooms } from '@/utils/api';

export default function Index() {
  const [activeRestroom, setActiveRestroom] = useState<Restroom | null>(null);
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);

  useEffect(() => {
    (async () => {
      const { longitude, latitude } = await getUserLocation();
      const data = await API_getRestrooms(longitude, latitude, 5000);
      setRestrooms(data);
    })(); 
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
