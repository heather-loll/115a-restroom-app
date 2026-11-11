import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { ArrowRight, Crosshair } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNearestAddress } from '../utils/location';

import { useSelectingLocationToCreateStore, useCurrentMapLocationStore } from '../utils/stores';

// This will show the user a centralized map pin.
// As they pan around on the map we can get the address of where they are pointed at.
// This should also hide the BottomNav and other map pins
// This component renders a preview of the address and a button to continue
// When continue is pressed, this view closes, all other views return to normal, and an AddRestroomSheet is rendered

export default function SelectLocation(props: { setAddRestroomSheetOpen: any }) {
  const { setAddRestroomSheetOpen } = props;
  const insets = useSafeAreaInsets();
  const [selectingLocation, setSelectingLocation] = useSelectingLocationToCreateStore();
  const [currentMapLocation] = useCurrentMapLocationStore();

  const [currentDisplayedAddress, setCurrentDisplayedAddress] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const handler = setTimeout(async () => {
        const addressString = await getNearestAddress(
          currentMapLocation.longitude,
          currentMapLocation.latitude,
        );

        setCurrentDisplayedAddress(addressString);
      }, 1000);

      return () => {
        setCurrentDisplayedAddress(null);
        clearTimeout(handler);
      };
    })();
  }, [currentMapLocation]);

  const next = () => {
    setAddRestroomSheetOpen(true);

    // Delay to prevent layout shift when adding back bottom nav
    setTimeout(() => {
      setSelectingLocation(false);
    }, 300);
  };

  return (
    <>
      <View style={[styles.topAddressContainer, { paddingTop: insets.top }]}>
        <Text style={styles.topAddressText}>{currentDisplayedAddress ?? ''}</Text>
        <Text style={styles.topCoordsText}>
          ({currentMapLocation.latitude.toFixed(4)}, {currentMapLocation.longitude.toFixed(4)})
        </Text>
      </View>
      <View style={styles.crosshairsContainer}>
        <Crosshair size={28} color="white" />
      </View>
      <Pressable
        onPress={next}
        style={styles.confirmLocationButton}
        android_ripple={{ color: '#ffffff33', foreground: true }}>
        <Text style={styles.confirmLocationText}>Confirm Location</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  confirmLocationButton: {
    position: 'absolute',
    insetInline: 48,
    insetBlockEnd: 30,
    backgroundColor: '#009966',
    borderRadius: 999,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: 16,
    overflow: 'hidden',
  },
  confirmLocationText: {
    textAlign: 'start',
    fontWeight: 600,
    fontSize: 16,
    color: 'white',
  },
  nextArrow: {
    right: 8,
    color: 'white',
  },
  crosshairsContainer: {
    position: 'absolute',
    inset: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  topAddressContainer: {
    position: 'absolute',
    width: '100%',
    insetInline: 0,
    alignItems: 'center',
    pointerEvents: 'none',
    paddingBlock: 12,
    top: 0,
  },
  topAddressText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 600,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  topCoordsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 400,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
