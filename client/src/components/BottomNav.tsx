import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { ListFilter, Plus, Settings } from 'lucide-react-native';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSelectingLocationToCreateStore } from '../utils/stores';
import AddRestroomSheet from './AddRestroomSheet';
import FilterSheet, { amenityFilters } from './FilterSheet';
import SelectLocation from './SelectLocation';

function SettingsSheet({ sheetRef }: { sheetRef: React.RefObject<BottomSheet | null> }) {
  return (
    <BottomSheet ref={sheetRef} snapPoints={['93%']} index={-1} enablePanDownToClose={true}>
      <BottomSheetView style={styles.sheetContainer}>
        <Text>Settings</Text>
      </BottomSheetView>
    </BottomSheet>
  );
}


export default function BottomNav(props: {
  amenitiesApplied: amenityFilters;
  setAmenitiesApplied: Dispatch<SetStateAction<amenityFilters>>;
}
) {
  const [addRestroomSheetOpen, setAddRestroomSheetOpen] = useState(false);

  const settingsSheetRef = useRef<BottomSheet>(null);

  const [FilterSheetOpen, setFilterSheetOpen] = useState(false);

  const [selectingLocation, setSelectingLocation] = useSelectingLocationToCreateStore();

  return (
    <>
      {!selectingLocation && (
        <View style={styles.container}>
          <Pressable
            style={[styles.settings, styles.bottomNavButton]}
            android_ripple={{ color: '#ffffff33', foreground: true }}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => settingsSheetRef.current?.snapToIndex(1)}>
            <Settings color="#fff" size={24} />
          </Pressable>
          <Pressable
            style={[styles.filter, styles.bottomNavButton]}
            android_ripple={{ color: '#ffffff33', foreground: true }}
            accessibilityRole="button"
            accessibilityLabel="Open filter options"
            onPress={() => {
              setFilterSheetOpen(true);
            }}>
            <ListFilter color="#fff" size={20} />
          </Pressable>
          <Pressable
            style={[styles.add, styles.bottomNavButton]}
            android_ripple={{ color: '#ffffff33', foreground: true }}
            onPress={() => {
              setSelectingLocation(true);
            }}>
            <Plus color="#fff" size={24} />
            <Text style={styles.addText}>Add Restroom</Text>
          </Pressable>
        </View>
      )}

      <SettingsSheet sheetRef={settingsSheetRef} />

      {FilterSheetOpen && (
        <FilterSheet
        applied={props.amenitiesApplied}
        setApplied={props.setAmenitiesApplied}
        setFilterSheetOpen={setFilterSheetOpen}
        />
      )}

      {selectingLocation && <SelectLocation setAddRestroomSheetOpen={setAddRestroomSheetOpen} />}
      {addRestroomSheetOpen && (
        <AddRestroomSheet setAddRestroomSheetOpen={setAddRestroomSheetOpen} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    paddingInline: 20,
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
  },
  bottomNavButton: {
    elevation: 8, // Shadows for Android
    shadowColor: '#000', // Shadows for iOS
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  settings: {
    height: 52,
    width: 52,
    backgroundColor: 'gray',
    borderRadius: 26,
  },
  filter: {
    height: 52,
    width: 52,
    backgroundColor: '#009966',
    borderRadius: 26,
  },
  add: {
    height: 52,
    backgroundColor: '#009966',
    borderRadius: 32,
    paddingInline: 16,
    gap: 8,
  },
  addText: {
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: 600,
  },
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    paddingBottom: 36,
  },
});
