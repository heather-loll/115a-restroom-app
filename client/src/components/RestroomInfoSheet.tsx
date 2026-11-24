import BottomSheet, { BottomSheetHandle, BottomSheetHandleProps, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Accessibility,
  Baby,
  DoorClosed,
  Droplets,
  LockKeyhole,
  LucideIcon,
  Transgender,
  X
} from 'lucide-react-native';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';



function AmenityItem(props: { shown: boolean, label: string, icon: LucideIcon}) {
  return(
    props.shown && (
      <View style={styles.listItem}> 
        <props.icon color="#000" size={24} />
        <Text style={styles.amenityText}>{props.label}</Text>
      </View>
    )
  )
}


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

  //modifies the actual top bar to contain the back button so that it doesnt get covered up
  const renderHandle = useCallback(
    (BottomSheetHandleProp: BottomSheetHandleProps) => (
      <View>
        <BottomSheetHandle {...BottomSheetHandleProp} />
        <Pressable style={styles.closeButton}
          onPress={() => setActiveRestroom(null)}>
          <X size={24} color="#85858B"/>
        </Pressable>
      </View>
    ),
    [setActiveRestroom]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={[250, '35%', '93%']}
      enablePanDownToClose={true}
      onChange={handleSheetChange}
      handleComponent={renderHandle}
      index={-1}>
      <BottomSheetView style={styles.sheetContainer}>

        <Text style={styles.sheetHeader}>{localData?.name}</Text>
        <Text style={styles.sheetAddress}>{localData?.address}</Text>
        <Text style={styles.sheetSubHeader}>Rate Bathroom</Text>

        <Text style={styles.sheetSubHeader}>Amenities</Text>
        <View style={styles.amenityContainer}>
          <AmenityItem shown = {localData?.amenities?.paymentRequired === true} label="Customers Only" icon={LockKeyhole} />
          <AmenityItem shown = {localData?.amenities?.accessible === true} label="Accessible" icon={Accessibility} />
          <AmenityItem shown = {localData?.amenities?.singleOccupancy === true} label="Single Occupancy" icon={DoorClosed} />
          <AmenityItem shown = {localData?.amenities?.unisex === true} label="Gender Neutral" icon={Transgender} />
          <AmenityItem shown = {localData?.amenities?.menstrualProductsAvailible === true} label="Menstrual Products" icon={Droplets} />
          <AmenityItem shown = {localData?.amenities?.babyChangingStation === true} label="Changing Station" icon={Baby} />
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
    fontSize: 12
  },
  closeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    //ios and android layering, didn't fix my issue but it adds a neat shadow
    zIndex: 2,
    elevation: 2,
  }
});
