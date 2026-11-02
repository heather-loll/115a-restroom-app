import { useRef, useState, Dispatch, SetStateAction, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

export default function RestroomInfoSheet(props: {
  restroom: Restroom | null;
  setActiveRestroom: Dispatch<SetStateAction<Restroom | null>>;
}) {
  const { restroom, setActiveRestroom } = props;

  const [localData, setLocalData] = useState<Restroom | null>(restroom);
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    if (restroom !== null) {
      setLocalData(restroom);
      bottomSheetRef.current?.snapToIndex(2);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [restroom]);

  const handleSheetChange = (index: number) => {
    if (index === -1) {
      setActiveRestroom(null);
      // Alert.alert("minimize triggered");
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={[250, '35%', '93%']}
      enablePanDownToClose={true}
      onChange={handleSheetChange}
      index={-1}>
      <BottomSheetView style={styles.sheetContainer}>
        <Text style={styles.sheetHeader}>{localData?.name}</Text>
        <Text style={styles.sheetSubHeader}>{localData?.address}</Text>
      </BottomSheetView>
    </BottomSheet>
  );
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
    marginBottom: 4,
  },
  sheetSubHeader: {
    color: 'gray',
    fontSize: 14,
  },
});
