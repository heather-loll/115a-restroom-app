import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import BottomNav from '../components/BottomNav';
import Map from '../components/Map';
import RestroomInfoSheet from '../components/RestroomInfoSheet';


export default function Index() {
  const [activeRestroom, setActiveRestroom] = useState<Restroom | null>(null);
  const [restrooms, setRestrooms] = useState<Restroom[]>([]);

  useEffect(() => {
    // API_getRestrooms(-122.026669, 36.975188, 5000).then(res => {
    //   setRestrooms(res);
    // });
    setRestrooms([
  {
    restroomId: "s",
    name: "Front & Soquel Restrooms",
    address: "315 Front Street, Santa Cruz, CA",
    latitude: 36.97326466616349,
    longitude: -122.02507860065315,
    amenities: {}
  },
  {
    restroomId: "constance",
    name: "Pleasure Pizza",
    address: "1415 Pacific Ave, Santa Cruz, CA",
    latitude: 36.975188,
    longitude: -122.026669,
    amenities: {}
  }])
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
