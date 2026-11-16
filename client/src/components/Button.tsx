import { Pressable, Text, StyleSheet } from 'react-native';
import { ArrowRight } from 'lucide-react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  showArrow?: boolean;
}

export default function Button({ children, onPress, showArrow = true }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.submitButton}
      android_ripple={{ color: '#00993333', foreground: true }}>
      <Text style={styles.submitText}>{children}</Text>
      {showArrow && <ArrowRight size={24} style={styles.submitArrow} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
});
