import {
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  reverseGeocodeAsync,
  Accuracy,
} from 'expo-location';

const DEFAULT_COORDS = {
  latitude: -122.026669,
  longitude: 36.975188,
};

export const getUserLocation = async () => {
  let { status } = await getForegroundPermissionsAsync();

  // Request location permission
  if (status !== 'granted') {
    const res = await requestForegroundPermissionsAsync();
    status = res.status;
  }

  let longitude: number;
  let latitude: number;

  if (status === 'granted') {
    try {
      const { coords } = await getCurrentPositionAsync({
        accuracy: Accuracy.Balanced,
      });

      longitude = coords.longitude;
      latitude = coords.latitude;
    } catch (error) {
      console.warn('GPS hardware error, falling back to defaults:', error);
      longitude = DEFAULT_COORDS.longitude;
      latitude = DEFAULT_COORDS.latitude;
    }
  } else {
    console.warn('Location permission denied');
    longitude = DEFAULT_COORDS.longitude;
    latitude = DEFAULT_COORDS.latitude;
  }

  return { longitude, latitude };
};

export const getNearestAddress = async (
  longitude: number,
  latitude: number,
): Promise<string | null> => {
  const { status } = await requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    console.warn('No location permissions');
    return null;
  }

  const addresses = await reverseGeocodeAsync({ longitude, latitude });

  if (addresses.length > 0) {
    const [address] = addresses;
    const { streetNumber, street, city, region, postalCode } = address;
    return [streetNumber, street, city, region, postalCode].filter(Boolean).join(', ');
  } else {
    // No addresses found at this location
    return null;
  }
};
