import axios from 'axios';

const BASE_URI = 'https://callielz.pythonanywhere.com/api';
const HTTP_TIMEOUT_SECONDS = 15;

export const get = async <T = any>(
  endpoint: string,
  params: any,
): Promise<[T | null, Error | null]> => {
  try {
    const response = await axios.get(`${BASE_URI}${endpoint}`, {
      params,
      timeout: HTTP_TIMEOUT_SECONDS * 1000,
    });
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
    const response = await axios.post(`${BASE_URI}${endpoint}`, body, {
      timeout: HTTP_TIMEOUT_SECONDS * 1000,
    });
    return [response.data, null];
  } catch (err) {
    if (err instanceof Error) {
      return [null, err];
    }

    return [null, new Error(String(err))];
  }
};
