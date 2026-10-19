import { useRef, useState, Dispatch, SetStateAction } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, TextInput } from "react-native";
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Check, ArrowRight, Pencil, LockKeyhole, Accessibility, DoorClosed, Transgender, Droplets, Baby, Germ, ThumbsUp, MopSparkles, LucideIcon } from 'lucide-react-native';

function CleanlinessRanking() {
  return (
    <View style={styles.cleanlinessContainer}>
      <Pressable style={[styles.cleanlinessOption, {borderLeftWidth: 2, borderRightWidth: 1, borderTopLeftRadius: 11, borderBottomLeftRadius: 11}]}>
        <Germ />
        <Text>Filthy</Text>
      </Pressable>
      <Pressable style={[styles.cleanlinessOption, {borderLeftWidth: 2, borderRightWidth: 0}]}>
        <ThumbsUp />
        <Text>Average</Text>
      </Pressable>
      <Pressable style={[styles.cleanlinessOption, {borderLeftWidth: 2, borderRightWidth: 2, borderTopRightRadius: 11, borderBottomRightRadius: 11, backgroundColor: '#00996620', borderColor: "#009933"}]}>
        <MopSparkles />
        <Text>Pristine</Text>
      </Pressable>
    </View>
  )
}

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

export default function AddRestroomSheet(props: {setAddRestroomSheetOpen: Dispatch<SetStateAction<boolean>>}) {
  const {setAddRestroomSheetOpen} = props
  const filterSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet
      ref={filterSheetRef}
      snapPoints={['93%']}
      enablePanDownToClose={true}
      index={1}
      onClose={() => {
        setAddRestroomSheetOpen(false)
      }}
    >
      <BottomSheetView
        style={styles.sheetContainer}
      >
        <ScrollView>
          {/*<TextInput placeholder="Restroom Name" placeholderTextColor="gray" enterKeyHint='done' />*/}
          <View style={styles.headingContainer}>
              <Text style={styles.heading}>Pleasure Pizza</Text>
            <Pressable>
              <Pencil size={14} color="gray" />
            </Pressable>
          </View>
          <Text style={styles.address}>1415 Pacific Ave, Santa Cruz, CA</Text>

          <Text style={styles.subheading}>Rate Cleanliness</Text>
          <CleanlinessRanking />

          <Text style={styles.subheading}>Select Amenities</Text>
          <View style={styles.cardContainer}>
            <ToggleCard label="Customers Only" icon={LockKeyhole} />
            <ToggleCard label="Accessible" icon={Accessibility} />
            <ToggleCard label="Single Occupancy" icon={DoorClosed} />
            <ToggleCard label="Gender Neutral" icon={Transgender} />
            <ToggleCard label="Menstrual Products" icon={Droplets} />
            <ToggleCard label="Changing Station" icon={Baby} />
          </View>

          <Pressable style={styles.submitButton}>
            <Text style={styles.submitText}>Submit</Text>
            <ArrowRight size={24} style={styles.submitArrow} />
          </Pressable>
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
  headingContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heading: {
    fontWeight: 800,
    fontSize: 26,
  },
  subheading: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8
  },
  address: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 18
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: '4%',
    marginBottom: 14
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
    top: 6,
    right: 6,
    display: "flex",
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardCheckboxChecked: {
    backgroundColor: '#009966',
    borderColor: '#009966'
  },
  submitButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#009966',
    color: 'white',
    paddingBlock: 12,
    borderRadius: 999,
    display: "flex",
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32
  },
  submitText: {
    textAlign: "center",
    color: "#009933",
    fontWeight: 600,
    fontSize: 16,
    flex: 1
  },
  submitArrow: {
    // position: "absolute",
    right: 8,
    color: "#009933"
  },
  cleanlinessContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 14
  },
  cleanlinessOption: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#dddddd',
    width: '33%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    paddingBlock: 8
  }
})
