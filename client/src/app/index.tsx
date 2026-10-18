import { useRef, useState } from 'react';
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Map from "./Map"
import BottomNav from "./BottomNav"
import RestroomInfoSheet from "./RestroomInfoSheet"

const restrooms: Restroom[] = [
  {
    restroomId: 1,
    name: "Front & Soquel Restrooms",
    address: "315 Front Street, Santa Cruz, CA",
    latitude: 36.97326466616349,
    longitude: -122.02507860065315,
    amenities: {}
  },
  {
    restroomId: 2,
    name: "Pleasure Pizza",
    address: "1415 Pacific Ave, Santa Cruz, CA",
    latitude: 36.975188,
    longitude: -122.026669,
    amenities: {}
  }
]

export default function Index() {
  const [activeRestroom, setActiveRestroom] = useState<Restroom | null>(null);

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
    alignItems: "center",
    justifyContent: "center",
  },
});
