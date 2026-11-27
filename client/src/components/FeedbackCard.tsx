import { View, Text, Pressable, StyleSheet } from 'react-native';

interface FeedbackCardProps {
  question: string;
  yesCallback: () => void;
  noCallback: () => void;
}

export default function FeedbackCard({ question, yesCallback, noCallback }: FeedbackCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.answerBox}>
        <Pressable>
          <Text style={styles.answerText}>Yes</Text>
        </Pressable>
        <Pressable>
          <Text style={styles.answerText}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBlockEnd: 24,
  },
  questionText: {
    fontSize: 16,
    marginBlockEnd: 2,
  },
  answerBox: {
    flexDirection: 'row',
    gap: 24,
  },
  answerText: {
    fontSize: 18,
    fontWeight: 700,
    color: '#009966',
  },
});
