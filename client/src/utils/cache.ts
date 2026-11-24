import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { MMKV } from 'react-native-mmkv';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let restrooms_cache: MMKV | null = null;

if (!isExpoGo) {
  try {
    const { createMMKV } = require('react-native-mmkv');
    restrooms_cache = createMMKV({ id: 'restrooms_cache' });
  } catch {
    restrooms_cache = null;
  }
}

export const restroomsCache = {
  cacheKey: 'all',
  get(): Restroom[] | null {
    if (!restrooms_cache) return null;

    const val = restrooms_cache.getString(this.cacheKey);
    if (!val) return null;

    try {
      return JSON.parse(val) as Restroom[];
    } catch {
      return null;
    }
  },
  set(value: Restroom[]) {
    if (!restrooms_cache) return;
    restrooms_cache.set(this.cacheKey, JSON.stringify(value));
  },
};
