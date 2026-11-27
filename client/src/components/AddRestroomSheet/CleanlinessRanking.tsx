import { Dispatch, SetStateAction } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Germ, ThumbsUp, MopSparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const BORDER = 2;

// [none, filthy, average, pristine] selected
const BORDERS = {
  filthy: { left: [2, 2, 2, 2], right: [1, 2, 0, 1] },
  average: { left: [1, 0, 2, 1], right: [1, 1, 2, 0] },
  pristine: { left: [1, 1, 0, 2], right: [2, 2, 2, 2] },
} as const;

interface CleanlinessRankingProps {
  state: [0 | 1 | 2 | 3, Dispatch<SetStateAction<0 | 1 | 2 | 3>>];
  callback?: () => void;
}

export default function CleanlinessRanking({
  state,
  callback = () => {},
}: CleanlinessRankingProps) {
  const [selected, setSelected] = state;

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
            onPress={() => {
              setSelected(selected === id ? 0 : id);
              Haptics.selectionAsync();
              callback();
            }}
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

const styles = StyleSheet.create({
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
