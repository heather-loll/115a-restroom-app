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
  ChevronRight,
} from 'lucide-react-native';
import { Dispatch, SetStateAction, useEffect, useRef, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { undoToast } from '../utils/toast';
import { toast } from 'sonner-native';

import RestroomRating from './RestroomRating';
import CleanlinessRanking from './AddRestroomSheet/CleanlinessRanking';

import { API_rateRestroom } from '../utils/api';

import { useSharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

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

  // Solution to trigger active restroom = null on sheet close always
  // Previous solutions had a lag and were unreliable
  const animatedIndex = useSharedValue(-1);
  const hasTriggeredClose = useSharedValue(false);

  const onImmediateClose = useCallback(() => {
    setActiveRestroom(null);
  }, []);

  useAnimatedReaction(
    () => animatedIndex.value,
    (currentIndex, previousIndex) => {
      if (currentIndex > -0.5) {
        hasTriggeredClose.value = false;
      }

      if (
        previousIndex !== null &&
        previousIndex > -0.5 &&
        currentIndex <= -0.5 &&
        !hasTriggeredClose.value
      ) {
        hasTriggeredClose.value = true;
        // 2. Use scheduleOnRN instead of runOnJS
        scheduleOnRN(onImmediateClose);
      }
    },
  );

  const onEventualClose = () => {
    setActiveRestroom(null);
  };

  const [cleanlinessEditorOpen, setCleanlinessEditorOpen] = useState(false);
  const [cleanScore, setCleanScore] = useState<0 | 1 | 2 | 3>(0);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={[250, '35%', '93%']}
      enablePanDownToClose={true}
      onClose={onEventualClose}
      animatedIndex={animatedIndex}
      index={-1}>
      <BottomSheetView style={styles.sheetContainer}>
        <Pressable style={styles.closeButton} onPress={() => setActiveRestroom(null)}>
          <X size={24} color="#85858B" />
        </Pressable>
        <Text style={styles.sheetHeader}>{localData?.name}</Text>
        <Text style={styles.sheetAddress}>{localData?.address}</Text>

        <View style={styles.sheetSubHeaderContainer}>
          <Text style={styles.sheetSubHeader}>Bathroom Rating</Text>
          <Pressable
            style={styles.subHeadingButton}
            onPress={() => {
              setCleanlinessEditorOpen(!cleanlinessEditorOpen);
            }}>
            {cleanlinessEditorOpen ? (
              <>
                <Text style={styles.subHeadingButtonText}>Cancel Rating</Text>
                <X size={18} color="#009966" />
              </>
            ) : (
              <>
                <Text style={styles.subHeadingButtonText}>Leave A Rating!</Text>
                <ChevronRight size={18} color="#009966" />
              </>
            )}
          </Pressable>
        </View>

        {!cleanlinessEditorOpen ? (
          <>
            <Text style={styles.sheetHeaderDescription}>
              {cleanlinessMessage(localData?.amenities.cleanliness ?? 0)}
            </Text>
            <RestroomRating rating={localData?.amenities.cleanliness ?? 0} />
          </>
        ) : (
          <CleanlinessRanking
            state={[cleanScore, setCleanScore]}
            callback={() => {
              if (!localData) return;
              setCleanlinessEditorOpen(false);
              const timeout = setTimeout(async () => {
                const res = await API_rateRestroom(localData.restroomId, cleanScore);
                if (!res) {
                  toast.error('Unable to send restroom rating due to a network error');
                }
              }, 4500);
              setCleanScore(0);
              undoToast('Rating Submitted!', () => {
                clearTimeout(timeout);
              });
            }}
          />
        )}

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
  },
  sheetSubHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    //   alignItems: 'center',
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
  subHeadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  subHeadingButtonText: {
    textTransform: 'uppercase',
    color: '#009966',
    fontWeight: 700,
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
