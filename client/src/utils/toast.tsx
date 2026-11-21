import { Pressable, Text } from 'react-native';
import { toast } from 'sonner-native';

export const undoToast = (text: string, undoCallback: () => void) => {
  const id = toast.success(text, {
    duration: 4000,
    invert: true,
    action: (
      <Pressable
        onPress={() => {
          toast.dismiss(id);
          undoCallback();
          toast.info('Rating undone!', { invert: true });
        }}>
        <Text
          style={{
            color: '#57d9ad',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}>
          Undo
        </Text>
      </Pressable>
    ),
  });
};
