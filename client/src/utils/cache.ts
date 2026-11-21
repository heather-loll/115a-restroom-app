import { createMMKV } from 'react-native-mmkv';

const restrooms_cache = createMMKV({ id: 'restrooms_cache' });

export const restroomsCache = {
  cacheKey: 'all',
  get(): Restroom[] | null {
    const val = restrooms_cache.getString(this.cacheKey);
    let parsed;

    try {
      parsed = val ? JSON.parse(val) : null;
    } catch {
      parsed = null;
    }

    return parsed;
  },
  set(value: Restroom[]) {
    restrooms_cache.set(this.cacheKey, JSON.stringify(value));
  },
};
