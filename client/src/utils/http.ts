import axios from 'axios';

const BASE_URI = 'http://10.0.0.210:5001/api';

export const get = async <T = any>(
  endpoint: string,
  params: any,
): Promise<[T | null, Error | null]> => {
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

export const post = async <T = any>(
  endpoint: string,
  body: any,
): Promise<[T | null, Error | null]> => {
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
