import { Pressable, Text } from 'react-native';
import { toast } from 'sonner-native';

export const errorToast = (text: string) => {
  toast.error(text, {
    duration: 4000,
  });
};

export const infoToast = (text: string) => {
  toast.info(text, {
    duration: 4000,
  });
};

export const undoToast = (text: string, undoCallback: () => void) => {
  const id = toast.success(text, {
    duration: 4000,
    action: (
      <Pressable
        onPress={() => {
          toast.dismiss(id);
          undoCallback();
          infoToast('Rating undone!');
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
