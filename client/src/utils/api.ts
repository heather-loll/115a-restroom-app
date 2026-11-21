import { get, post } from './http';
import { restroomsCache } from './cache';

// Error unwrapping: always returns an array of [ResponseObject?, Error?]
// If there's no error, it will be [ResponseObject, null]
// If there is an error, it will be [null, Error]

// Style guide: All exported functions should begin with "API_" and then be camel cased
// This makes it clear what is making API calls vs ordinary function calls

export const API_getRestrooms = async (
  longitude: number,
  latitude: number,
  radius_meters?: number,
): Promise<Restroom[]> => {
  const [data, error] = await get<GetRestroomsAPIResponse>('/restrooms/nearby', {
    longitude,
    latitude,
    radius_meters,
  });

  if (error || !data) {
    const cachedRestrooms = restroomsCache.get();
    if (cachedRestrooms === null) {
      // API error and cache miss !!
      return [];
    } else {
      return cachedRestrooms;
    }
  }

  restroomsCache.set(data.restrooms);
  return data.restrooms;
};

export const API_submitRestroom = async (
  longitude: number,
  latitude: number,
  address: string | undefined,
  cleanliness: 1 | 2 | 3 | undefined = undefined,
  amenities: AmenitiesList,
): Promise<Restroom | null> => {
  const [data, error] = await post<Restroom>('/restrooms', {
    longitude,
    latitude,
    address,
    cleanliness,
    amenities,
  });

  if (error || !data) {
    return null;
  }

  return data;
};
