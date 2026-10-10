import { useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Check, Banknote, Accessibility, DoorClosed, Transgender, Droplets, Baby, LucideIcon } from 'lucide-react-native';

function ToggleCard(props: { label: string, icon: LucideIcon }) {
  const [checked, setChecked] = useState(false);

  return (
    <Pressable style={[styles.card, checked ? styles.cardChecked : {}]} onPress={() => setChecked(!checked)}>
      <props.icon size={32} style={styles.cardIcon} />
      <Text style={styles.cardLabel}>{props.label}</Text>

      <View style={[styles.cardCheckbox, checked ? styles.cardCheckboxChecked : {}]}>
        {checked && <Check size={16} strokeWidth={3} color="white" />}
      </View>
    </Pressable>
  )
}

export default function AddRestroomSheet() {
  const filterSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={filterSheetRef}
      snapPoints={['93%']}
      enablePanDownToClose={true}
      index={1}
    >
      <BottomSheetView
        style={styles.sheetContainer}
      >
        <ScrollView>
          {/*<TextInput placeholder="Restroom Name" placeholderTextColor="gray" enterKeyHint='done' />*/}
          <Text>Amenities</Text>
          <View style={styles.cardContainer}>
            <ToggleCard label="Customers Only" icon={Banknote} />
            <ToggleCard label="Accessible" icon={Accessibility} />
            <ToggleCard label="Single Occupancy" icon={DoorClosed} />
            <ToggleCard label="Gender Neutral" icon={Transgender} />
            <ToggleCard label="Menstrual Products" icon={Droplets} />
            <ToggleCard label="Changing Station" icon={Baby} />
          </View>
        </ScrollView>
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    paddingInline: 24,
    height: '100%'
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '4%'
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
  },
  cardChecked: {
    borderColor: '#009966',
    backgroundColor: '#00996620'
  },
  cardIcon: {
    marginBottom: 8
  },
  cardLabel: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 500
  },
  cardCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#dddddd',
    position: 'absolute',
    top: 5,
    right: 5,
    display: "flex",
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardCheckboxChecked: {
    backgroundColor: '#009966',
    borderColor: '#009966'
  }
})
