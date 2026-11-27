import { View, Text, StyleSheet } from 'react-native';

interface RestroomRatingProps {
  rating: number;
}

export default function RestroomRatingProps({ rating }: RestroomRatingProps) {
  const percentage = ((rating - 1) / 2) * 100;
  // Prevents it from being in the top or bottom n% visually
  const PERCENT_BUFFER = 5;
  const visualScaledPercentage = PERCENT_BUFFER + (percentage / 100) * (100 - PERCENT_BUFFER);
  return (
    <View aria-hidden={true}>
      <View style={styles.rangeTrack}>
        {rating !== 0 && (
          <View style={[styles.rangeThumb, { marginInlineStart: `${visualScaledPercentage}%` }]} />
        )}
      </View>
      <View style={styles.optionsDescriptionContainer}>
        <Text style={[styles.optionsDescription, { textAlign: 'start' }]}>Filthy</Text>
        <Text style={[styles.optionsDescription, { textAlign: 'center' }]}>Average</Text>
        <Text style={[styles.optionsDescription, { textAlign: 'end' }]}>Pristine</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rangeTrack: {
    backgroundImage: 'linear-gradient(90deg, #ff3b30 0%, #ffcc00 50%, #34c759 100%)',
    height: 8,
    borderRadius: 999,
    justifyContent: 'center',
  },
  rangeThumb: {
    backgroundColor: 'white',
    width: 17,
    height: 17,
    borderRadius: 999,
    elevation: 4, // Shadows for Android
    shadowColor: '#000', // Shadows for iOS
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    flexShrink: 0,
    left: -9.5,
    marginInlineStart: '50%',
    borderColor: '#dddddd',
    borderWidth: 1,
  },
  optionsDescriptionContainer: {
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingBlockStart: 2,
    marginBottom: 12,
  },
  optionsDescription: {
    color: '#aaaaaa',
    width: '33.333%',
  },
});
