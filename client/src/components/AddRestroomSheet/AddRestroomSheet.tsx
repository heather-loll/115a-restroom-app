import { useRef, useState, Dispatch, SetStateAction } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { Pencil } from 'lucide-react-native';

import { useCurrentMapLocationStore } from '../../utils/stores';
import { getNearestAddress } from '../../utils/location';
import { API_submitRestroom } from '@/utils/api';

import CleanlinessRanking from './CleanlinessRanking';
import ToggleCardList from './ToggleCardList';

import Button from '../Button';

interface AddRestroomSheetProps {
  setAddRestroomSheetOpen: Dispatch<SetStateAction<boolean>>;
}
export default function AddRestroomSheet({ setAddRestroomSheetOpen }: AddRestroomSheetProps) {
  const filterSheetRef = useRef<BottomSheet>(null);

  const [currentMapLocation] = useCurrentMapLocationStore();
  const [address, setAddress] = useState('');
  const [cleanliness, setCleanliness] = useState<0 | 1 | 2 | 3>(0);
  const [amenities, setAmenities] = useState({
    paymentRequired: false,
    accessible: false,
    unisex: false,
    singleOccupancy: false,
    menstrualProductsAvailible: false,
    babyChangingStation: false,
  });

  getNearestAddress(currentMapLocation.longitude, currentMapLocation.latitude).then(a => {
    setAddress(a ?? '');
  });

  const submit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await API_submitRestroom(
      currentMapLocation.longitude,
      currentMapLocation.latitude,
      address,
      cleanliness || undefined,
      amenities,
    );

    setAddRestroomSheetOpen(false);
  };

  const updateAmenities = (id: AmenityId, value: boolean) => {
    const newAmenities = { ...amenities };
    newAmenities[id] = value;
    setAmenities(newAmenities);
  };

  return (
    <BottomSheet
      ref={filterSheetRef}
      snapPoints={['93%']}
      enablePanDownToClose={true}
      index={1}
      onClose={() => {
        setAddRestroomSheetOpen(false);
      }}>
      <BottomSheetScrollView style={styles.sheetContainer}>
        {/*<TextInput placeholder="Restroom Name" placeholderTextColor="gray" enterKeyHint='done' />*/}
        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Business Name</Text>
          <Pressable>
            <Pencil size={14} color="gray" />
          </Pressable>
        </View>
        <Text style={styles.address}>{address}</Text>

        <Text style={styles.subheading}>Rate Cleanliness</Text>
        <CleanlinessRanking state={[cleanliness, setCleanliness]} />

        <Text style={styles.subheading}>Select Amenities</Text>
        <ToggleCardList updateAmenities={updateAmenities} />

        <Button onPress={submit}>Submit</Button>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    height: '100%',
  },
  headingContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heading: {
    fontWeight: 800,
    fontSize: 26,
  },
  subheading: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
  },
  address: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 24,
  },
});
