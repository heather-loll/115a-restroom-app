import BottomSheet, { BottomSheetHandle, BottomSheetHandleProps, BottomSheetView } from '@gorhom/bottom-sheet';
import {
  Accessibility,
  ArrowRight,
  Baby,
  DoorClosed,
  Droplets,
  LockKeyhole,
  LucideIcon,
  Transgender,
  X,
} from 'lucide-react-native';
import { Dispatch, SetStateAction, useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function ToggleAmenity(props: {
  id: string;
  label: string;
  icon: LucideIcon;
  checked: boolean;
  onToggle: Function;
}) {
  return (
    <Pressable style={[styles.listItem, props.checked ? styles.listItemChecked : {}]}
     onPress={() => {
        props.onToggle(props.id);
     }}>
      <props.icon color="#000" size={24} />
      <Text style={styles.amenityText}>{props.label}</Text>
     </Pressable>

  );
}

export type amenityFilters = {
  paymentRequired: boolean,
  accessible: boolean,
  unisex: boolean,
  singleOccupancy: boolean,
  menstrualProductsAvailible: boolean,
  babyChangingStation: boolean,
}

export default function FilterSheet({ applied, setApplied, setFilterSheetOpen }: {
  applied: amenityFilters
  setApplied: Dispatch<SetStateAction<amenityFilters>>
  setFilterSheetOpen: Dispatch<SetStateAction<boolean>>
}) {
  const [draft, setDraft] = useState<amenityFilters>(applied);

  const toggleAmenity = (id: string) => {
    setDraft((prev) => ({...prev, [id]: !(prev as Record<string, boolean>)[id] }))
  }

  const onSubmit = () => {
    setApplied({ ...draft })
    close()
  }

  const close = () => {
    bottomSheetRef.current?.close();
  }

  const renderHandle = useCallback(
    (BottomSheetHandleProp: BottomSheetHandleProps) => (
      <View>
        <BottomSheetHandle {...BottomSheetHandleProp} />
        <Pressable style={styles.closeButton}
          onPress={() => close()}>
          <X size={24} color="#85858B"/>
        </Pressable>
      </View>
    ),
    [setFilterSheetOpen]
  );

  const bottomSheetRef = useRef<BottomSheet>(null);

  return (
    <BottomSheet 
      ref={bottomSheetRef}
      snapPoints={[250, '50%']}
      enablePanDownToClose={true}
      handleComponent={renderHandle}
      index={1}
      onClose={() => {
        setFilterSheetOpen(false);
      }}>
    
      <BottomSheetView style={styles.sheetContainer}>
        <Text style={styles.sheetHeader}>Filters</Text>
        <Text style={styles.sheetSubHeader}>Amenities</Text>
        <View style={styles.amenityContainer}>
          <ToggleAmenity
            id="paymentRequired"
            label="Customers Only"
            icon={LockKeyhole}
            checked={draft.paymentRequired}
            onToggle={toggleAmenity}
          />
          <ToggleAmenity
            id="accessible"
            label="Accessible"
            icon={Accessibility}
            checked={draft.accessible}
            onToggle={toggleAmenity}
          />
          <ToggleAmenity
            id="singleOccupancy"
            label="Single Occupancy"
            icon={DoorClosed}
            checked={draft.singleOccupancy}
            onToggle={toggleAmenity}
          />
          <ToggleAmenity
            id="unisex"
            label="Gender Neutral"
            icon={Transgender}
            checked={draft.unisex}
            onToggle={toggleAmenity}
          />
          <ToggleAmenity
            id="menstrualProductsAvailible"
            label="Menstrual Products"
            icon={Droplets}
            checked={draft.menstrualProductsAvailible}
            onToggle={toggleAmenity}
          />
          <ToggleAmenity
            id="babyChangingStation"
            label="Changing Station"
            icon={Baby}
            checked={draft.babyChangingStation}
            onToggle={toggleAmenity}
          />

        </View>
        <Pressable
            onPress={onSubmit}
            style={styles.submitButton}
            android_ripple={{ color: '#b7930039', foreground: true }}>
            <Text style={styles.submitText}>Set Filter</Text>
            <ArrowRight size={24} style={styles.submitArrow} />
          </Pressable>     
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
  amenityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  listItemChecked: {
    borderColor: '#FFCC00',
    backgroundColor: '#b7930039',
  },
  listItem: {
    borderWidth: 2,
    borderRadius: 12,
    paddingBlock: 2,   
    borderColor: '#dddddd',
    width: '48%',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12
  },
  submitButton: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#FFCC00',
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
    color: '#977900',
    fontWeight: 600,
    fontSize: 16,
    flex: 1,
  },
  submitArrow: {
    // position: "absolute",
    right: 8,
    color: '#977900',
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
