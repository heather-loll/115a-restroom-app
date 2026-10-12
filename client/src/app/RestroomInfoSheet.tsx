import { useRef } from 'react';
import { StyleSheet, Text } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function RestroomInfoSheet(props: { restroom: Restroom }) {
  const { restroom } = props;

  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      // Signal to minimize map pin
    }
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={[250, '35%', '93%']}
      enablePanDownToClose={true}
      onChange={handleSheetChange}
      index={2}
    >
      <BottomSheetView
        style={styles.sheetContainer}
      >
        <Text style={styles.sheetHeader}>{restroom.name}</Text>
        <Text style={styles.sheetSubHeader}>{restroom.address}</Text>
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
  sheetHeader: {
    fontWeight: 800,
    fontSize: 24,
    marginBottom: 4
  },
  sheetSubHeader: {
    color: 'gray',
    fontSize: 14
  },
})
