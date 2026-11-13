import { useRef, useState, Dispatch, SetStateAction } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import {
  Check,
  ArrowRight,
  Pencil,
  LockKeyhole,
  Accessibility,
  DoorClosed,
  Transgender,
  Droplets,
  Baby,
  Germ,
  ThumbsUp,
  MopSparkles,
  LucideIcon,
} from 'lucide-react-native';

import { useCurrentMapLocationStore } from '../utils/stores';
import { getNearestAddress } from '../utils/location';
import { API_submitRestroom } from '@/utils/api';

const BORDER = 2;

// [none, filthy, average, pristine] selected
const BORDERS = {
  filthy: { left: [2, 2, 2, 2], right: [1, 2, 0, 1] },
  average: { left: [1, 0, 2, 1], right: [1, 1, 2, 0] },
  pristine: { left: [1, 1, 0, 2], right: [2, 2, 2, 2] },
} as const;

function CleanlinessRanking(props: {
  state: [0 | 1 | 2 | 3, Dispatch<SetStateAction<0 | 1 | 2 | 3>>];
}) {
  const [selected, setSelected] = props.state;

  const options = [
    { id: 1, key: 'filthy', label: 'Filthy', Icon: Germ },
    { id: 2, key: 'average', label: 'Average', Icon: ThumbsUp },
    { id: 3, key: 'pristine', label: 'Pristine', Icon: MopSparkles },
  ] as const;

  return (
    <View style={styles.cleanlinessContainer}>
      {options.map(({ id, key, label, Icon }, i) => {
        const left = BORDERS[key].left[selected];
        const right = BORDERS[key].right[selected];

        return (
          <Pressable
            key={id}
            onPress={() => setSelected(selected === id ? 0 : id)}
            // android_ripple={{ color: !selected ? '#ffffff50' : '#0099331a', foreground: true }}
            style={[
              styles.cleanlinessOption,
              {
                borderLeftWidth: left,
                borderRightWidth: right,
                paddingLeft: BORDER - left,
                paddingRight: BORDER - right,
              },
              i === 0 && {
                borderTopLeftRadius: 11,
                borderBottomLeftRadius: 11,
              },
              i === options.length - 1 && {
                borderTopRightRadius: 11,
                borderBottomRightRadius: 11,
              },
              selected === id && selectedStyles,
            ]}>
            <Icon color="black" />
            <Text>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const selectedStyles = {
  backgroundColor: '#00996620',
  borderColor: '#009933',
};

function ToggleCard(props: {
  id: string;
  label: string;
  icon: LucideIcon;
  updateAmenities: Function;
}) {
  const [checked, setChecked] = useState(false);

  return (
    <Pressable
      style={[styles.card, checked ? styles.cardChecked : {}]}
      // android_ripple={{ color: !checked ? '#ffffff50' : '#0099331a', foreground: true }}
      onPress={() => {
        props.updateAmenities(props.id, !checked);
        setChecked(!checked);
      }}>
      <props.icon size={32} style={styles.cardIcon} />
      <Text style={styles.cardLabel}>{props.label}</Text>

      {props.label === 'Customers Only' && <Text style={styles.cardSubLabel}>(Code Required)</Text>}

      <View style={[styles.cardCheckbox, checked ? styles.cardCheckboxChecked : {}]}>
        {checked && <Check size={16} strokeWidth={3} color="white" />}
      </View>
    </Pressable>
  );
}

export default function AddRestroomSheet(props: {
  setAddRestroomSheetOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { setAddRestroomSheetOpen } = props;
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

        <Pressable
          onPress={submit}
          style={styles.submitButton}
          android_ripple={{ color: '#00993333', foreground: true }}>
          <Text style={styles.submitText}>Submit</Text>
          <ArrowRight size={24} style={styles.submitArrow} />
        </Pressable>
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
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '4%',
    marginBottom: 14,
  },
  card: {
    width: '48%',
    borderColor: '#dddddd',
    borderWidth: 2,
    borderRadius: 12,
    paddingBlock: 16,
    paddingInline: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardChecked: {
    borderColor: '#009966',
    backgroundColor: '#00996620',
  },
  cardIcon: {
    marginBottom: 8,
    color: 'black',
  },
  cardLabel: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 500,
  },
  cardSubLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 400,
    opacity: 0.5,
  },
  cardCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#dddddd',
    position: 'absolute',
    top: 6,
    right: 6,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCheckboxChecked: {
    backgroundColor: '#009966',
    borderColor: '#009966',
  },
  submitButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#009966',
    color: 'white',
    paddingBlock: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    overflow: 'hidden',
  },
  submitText: {
    textAlign: 'center',
    color: '#009933',
    fontWeight: 600,
    fontSize: 16,
    flex: 1,
  },
  submitArrow: {
    // position: "absolute",
    right: 8,
    color: '#009933',
  },
  cleanlinessContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 16,
  },
  cleanlinessOption: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#dddddd',
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    paddingBlock: 8,
    overflow: 'hidden',
  },
});
