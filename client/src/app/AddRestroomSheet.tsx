import { useRef } from 'react';
import { StyleSheet, Text } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function AddRestroomSheet() {
  const filterSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={filterSheetRef}
      snapPoints={['93%']}
      index={1}
    >
      <BottomSheetView
        style={styles.sheetContainer}
      >
        <Text>Add Restroom!</Text>
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    paddingBottom: 36,
  },
})
