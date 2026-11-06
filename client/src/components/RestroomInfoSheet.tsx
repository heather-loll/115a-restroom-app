import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Transgender } from 'lucide-react-native';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
        <Text style={styles.sheetAddress}>{localData?.address}</Text>
        <Text style={styles.sheetSubHeader}>Rate Bathroom</Text>

        <Text style={styles.sheetSubHeader}>Amenities</Text>
        <View style={styles.amenityContainer}>
          <View style={styles.listItem}> 
            {/* temp to show multiple obj layout */}
            <Transgender color="#000" size={28} />
            <Text style={styles.amenityText}>Unisex</Text>
          </View>
           <View style={styles.listItem}> 
            <Transgender color="#000" size={28} />
            <Text style={styles.amenityText}>Unisex</Text>
          </View>
           <View style={styles.listItem}> 
            <Transgender color="#000" size={28} />
            <Text style={styles.amenityText}>Unisex</Text>
          </View>
           <View style={styles.listItem}> 
            <Transgender color="#000" size={28} />
            <Text style={styles.amenityText}>Unisex</Text>
          </View>
           <View style={styles.listItem}> 
            <Transgender color="#000" size={28} />
            <Text style={styles.amenityText}>Unisex</Text>
          </View>
        </View>
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
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  sheetAddress: {
    color: 'gray',
    fontSize: 14,
  },
  amenityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listItem: {
    width: '50%',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  amenityText: {
    fontSize: 16
  }
});
