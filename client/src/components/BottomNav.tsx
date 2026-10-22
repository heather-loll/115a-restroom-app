import { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Plus, Settings, ListFilter } from 'lucide-react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import AddRestroomSheet from './AddRestroomSheet';

function SettingsSheet({ sheetRef }: { sheetRef: React.RefObject<BottomSheet | null> }) {
  return (
    <BottomSheet ref={sheetRef} snapPoints={['93%']} index={-1} enablePanDownToClose={true}>
      <BottomSheetView style={styles.sheetContainer}>
        <Text>Settings</Text>
      </BottomSheetView>
    </BottomSheet>
  );
}

function FilterSheet({ sheetRef }: { sheetRef: React.RefObject<BottomSheet | null> }) {
  return (
    <BottomSheet ref={sheetRef} snapPoints={['35%']} index={-1} enablePanDownToClose={true}>
      <BottomSheetView style={styles.sheetContainer}>
        <Text>Filers</Text>
      </BottomSheetView>
    </BottomSheet>
  );
}

export default function Fab() {
  const [addRestroomSheetOpen, setAddRestroomSheetOpen] = useState(false);

  const settingsSheetRef = useRef<BottomSheet>(null);
  const filterSheetRef = useRef<BottomSheet>(null);

  return (
    <>
      <View style={styles.container}>
        <Pressable
          style={styles.settings}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => settingsSheetRef.current?.snapToIndex(1)}>
          <Settings color="#fff" size={24} />
        </Pressable>
        <Pressable
          style={styles.filter}
          accessibilityRole="button"
          accessibilityLabel="Open filter options"
          onPress={() => filterSheetRef.current?.snapToIndex(1)}>
          <ListFilter color="#fff" size={20} />
        </Pressable>
        <Pressable
          style={styles.add}
          onPress={() => {
            setAddRestroomSheetOpen(true);
          }}>
          <Plus color="#fff" size={24} />
          <Text style={styles.addText}>Add Restroom</Text>
        </Pressable>
      </View>

      <SettingsSheet sheetRef={settingsSheetRef} />
      <FilterSheet sheetRef={filterSheetRef} />
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
  settings: {
    height: 52,
    width: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'gray',
    borderRadius: 26,
  },
  filter: {
    height: 52,
    width: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009966',
    borderRadius: 26,
  },
  add: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#009966',
    borderRadius: 32,
    elevation: 8, // Shadows for Android
    shadowColor: '#000', // Shadows for iOS
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
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
