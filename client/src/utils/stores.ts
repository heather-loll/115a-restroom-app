import { create } from 'zustand';

export const useSelectingLocationToCreateStore = createGlobalState<boolean>(false);
export const useCurrentMapLocationStore = createGlobalState<{
  longitude: number;
  latitude: number;
}>({
  longitude: 0,
  latitude: 0,
});

// Implementation

interface GlobalState<T> {
  value: T;
  setValue: (newValue: T | ((prev: T) => T)) => void;
}

export function createGlobalState<T>(defaultValue: T) {
  const useStore = create<GlobalState<T>>(set => ({
    value: defaultValue,
    setValue: newValue =>
      set(state => ({
        value: typeof newValue === 'function' ? (newValue as Function)(state.value) : newValue,
      })),
  }));

  return function useGlobalState(): readonly [T, (newValue: T | ((prev: T) => T)) => void] {
    const value = useStore(state => state.value);
    const setValue = useStore(state => state.setValue);

    return [value, setValue] as const;
  };
}
