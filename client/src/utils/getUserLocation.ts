import {
  getForegroundPermissionsAsync,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
  Accuracy,
} from 'expo-location';

const DEFAULT_COORDS = {
  latitude: -122.026669,
  longitude: 36.975188,
};

export default async () => {
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
