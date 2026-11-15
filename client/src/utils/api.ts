import axios from 'axios';

const BASE_URI = 'http://10.0.0.210:5001/api';

// Error unwrapping: always returns an array of [ResponseObject?, Error?]
// If there's no error, it will be [ResponseObject, null]
// If there is an error, it will be [null, Error]

const get = async <T = any>(endpoint: string, params: any): Promise<[T | null, Error | null]> => {
  try {
    const response = await axios.get(`${BASE_URI}${endpoint}`, { params });
    return [response.data, null];
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return [null, err];
    }

    return [null, new Error(String(err))];
  }
};

const post = async <T = any>(endpoint: string, body: any): Promise<[T | null, Error | null]> => {
  try {
    const response = await axios.post(`${BASE_URI}${endpoint}`, body);
    return [response.data, null];
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return [null, err];
    }

    return [null, new Error(String(err))];
  }
};

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
    return [];
  }

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
