import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Accessibility,
  Baby,
  DoorClosed,
  Droplets,
  LockKeyhole,
  LucideIcon,
  Transgender,
  X,
} from 'lucide-react-native';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import RestroomRating from './RestroomRating';

interface AmenityItemProps {
  shown: boolean;
  label: string;
  icon: LucideIcon;
}

function AmenityItem({ shown, label, icon }: AmenityItemProps) {
  const Icon = icon;
  return (
    shown && (
      <View style={styles.listItem}>
        <Icon color="#000" size={24} />
        <Text style={styles.amenityText}>{label}</Text>
      </View>
    )
  );
}

const cleanlinessMessage = (score: number) => {
  switch (true) {
    case score === 0:
      return 'This restroom has not been rated yet';
    case score >= 1 && score < 1.3:
      return 'Most users say this restroom is filty.';
    case score >= 1.3 && score < 1.7:
      return 'Most users say this restroom is dirty.';
    case score >= 1.7 && score <= 2.3:
      return 'Most users say this restroom is average in cleanliness.';
    case score >= 2.3 && score <= 2.7:
      return 'Most users say this restroom is clean!';
    case score >= 2.7 && score <= 3:
      return 'Most users say this restroom is pristine!';
    default:
      return 'Out of range';
  }
};

interface RestroomInfoSheetProps {
  restroom: Restroom | null;
  setActiveRestroom: Dispatch<SetStateAction<Restroom | null>>;
}

export default function RestroomInfoSheet({ restroom, setActiveRestroom }: RestroomInfoSheetProps) {
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
        <Pressable style={styles.closeButton} onPress={() => setActiveRestroom(null)}>
          <X size={24} color="#85858B" />
        </Pressable>
        <Text style={styles.sheetHeader}>{localData?.name}</Text>
        <Text style={styles.sheetAddress}>{localData?.address}</Text>

        <Text style={styles.sheetSubHeader}>Bathroom Rating</Text>
        <Text style={styles.sheetHeaderDescription}>
          {cleanlinessMessage(localData?.amenities.cleanliness ?? 0)}
        </Text>
        <RestroomRating rating={localData?.amenities.cleanliness ?? 0} />

        <Text style={styles.sheetSubHeader}>Amenities</Text>
        <View style={styles.amenityContainer}>
          <AmenityItem
            shown={localData?.amenities?.paymentRequired === true}
            label="Customers Only"
            icon={LockKeyhole}
          />
          <AmenityItem
            shown={localData?.amenities?.accessible === true}
            label="Accessible"
            icon={Accessibility}
          />
          <AmenityItem
            shown={localData?.amenities?.singleOccupancy === true}
            label="Single Occupancy"
            icon={DoorClosed}
          />
          <AmenityItem
            shown={localData?.amenities?.unisex === true}
            label="Gender Neutral"
            icon={Transgender}
          />
          <AmenityItem
            shown={localData?.amenities?.menstrualProductsAvailible === true}
            label="Menstrual Products"
            icon={Droplets}
          />
          <AmenityItem
            shown={localData?.amenities?.babyChangingStation === true}
            label="Changing Station"
            icon={Baby}
          />
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
    // marginBottom: 2,
  },
  sheetSubHeader: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  sheetHeaderDescription: {
    color: 'gray',
    fontSize: 14,
    marginTop: -6,
    marginBottom: 10,
  },
  sheetAddress: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 20,
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
    marginBottom: 16,
  },
  amenityText: {
    fontSize: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: -8,
  },
});
