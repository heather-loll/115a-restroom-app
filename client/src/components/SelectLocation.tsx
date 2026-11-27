import { Dispatch, SetStateAction } from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Crosshair } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getNearestAddress } from '../utils/location';

import { useSelectingLocationToCreateStore, useCurrentMapLocationStore } from '../utils/stores';
import { ProgressiveBlur } from './ProgressiveBlur';

interface SelectLocationProps {
  setAddRestroomSheetOpen: Dispatch<SetStateAction<boolean>>;
}

export default function SelectLocation({ setAddRestroomSheetOpen }: SelectLocationProps) {
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
      <ProgressiveBlur style={styles.blur} />
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
    mixBlendMode: 'difference',
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
  blur: {
    width: '100%',
    height: 180,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: undefined,
  },
});
