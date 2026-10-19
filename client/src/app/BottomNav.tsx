import { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Plus, Settings, ListFilter } from 'lucide-react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import AddRestroomSheet from './AddRestroomSheet';

const settingsSheetRef = useRef<BottomSheet>(null);

function SettingsSheet() {
  return (
    <BottomSheet
      ref={settingsSheetRef}
      snapPoints={['93%']}
      index={-1}
      enablePanDownToClose={true}
    >
      <BottomSheetView
        style={styles.sheetContainer}
      >
        <Text>Settings</Text>
      </BottomSheetView>
    </BottomSheet>
  )
}

const filterSheetRef = useRef<BottomSheet>(null);

function FilterSheet() {
  return (
    <BottomSheet
      ref={filterSheetRef}
      snapPoints={['35%']}
      index={-1}
      enablePanDownToClose={true}
    >
      <BottomSheetView
        style={styles.sheetContainer}
      >
        <Text>Filers</Text>
      </BottomSheetView>
    </BottomSheet>
  )
}

export default function Fab() {
  const [addRestroomSheetOpen, setAddRestroomSheetOpen] = useState(false);

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.settings}
          activeOpacity={0.8}
          onPress={() => settingsSheetRef.current?.snapToIndex(1)}
        >
          <Settings color="#fff" size={24} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filter}
          activeOpacity={0.8}
          onPress={() => filterSheetRef.current?.snapToIndex(1)}
        >
          <ListFilter color="#fff" size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.add}
          activeOpacity={0.8}
          onPress={() => {setAddRestroomSheetOpen(true)}}
        >
          <Plus color="#fff" size={24} />
          <Text style={styles.addText}>Add Restroom</Text>
        </TouchableOpacity>
      </View>

      <SettingsSheet />
      <FilterSheet />
      { addRestroomSheetOpen && <AddRestroomSheet setAddRestroomSheetOpen={setAddRestroomSheetOpen} />}
    </>
  )
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "gray",
    borderRadius: 26
  },
  filter: {
    height: 52,
    width: 52,
    display: 'flex',
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: '#009966',
    borderRadius: 26
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
    gap: 8
  },
  addText: {
    fontSize: 16,
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: 600
  },
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    paddingBottom: 36,
  },
});
