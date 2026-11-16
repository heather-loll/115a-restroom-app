import { StyleSheet, View } from 'react-native';

import {
  LockKeyhole,
  Accessibility,
  DoorClosed,
  Transgender,
  Droplets,
  Baby,
} from 'lucide-react-native';

import ToggleCard from './ToggleCard';

interface ToggleCardListProps {
  updateAmenities: (id: AmenityId, checked: boolean) => void;
}

export default function ToggleCardList({ updateAmenities }: ToggleCardListProps) {
  return (
    <View style={styles.cardContainer}>
      <ToggleCard
        id="paymentRequired"
        label="Customers Only"
        icon={LockKeyhole}
        updateAmenities={updateAmenities}
      />
      <ToggleCard
        id="accessible"
        label="Accessible"
        icon={Accessibility}
        updateAmenities={updateAmenities}
      />
      <ToggleCard
        id="singleOccupancy"
        label="Single Occupancy"
        icon={DoorClosed}
        updateAmenities={updateAmenities}
      />
      <ToggleCard
        id="unisex"
        label="Gender Neutral"
        icon={Transgender}
        updateAmenities={updateAmenities}
      />
      <ToggleCard
        id="menstrualProductsAvailible"
        label="Menstrual Products"
        icon={Droplets}
        updateAmenities={updateAmenities}
      />
      <ToggleCard
        id="babyChangingStation"
        label="Changing Station"
        icon={Baby}
        updateAmenities={updateAmenities}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '4%',
    marginBottom: 14,
  },
});
