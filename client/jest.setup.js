jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');

  const BottomSheet = React.forwardRef(({ children }, ref) => {
    React.useImperativeHandle(ref, () => ({
      expand: () => {},
      collapse: () => {},
      close: () => {},
      forceClose: () => {},
      snapToIndex: () => {},
    }));
    return React.createElement(View, null, children);
  });

  const passthrough = ({ children }) => React.createElement(View, null, children);

  return {
    __esModule: true,
    default: BottomSheet,
    BottomSheetView: passthrough,
    BottomSheetScrollView: passthrough,
    BottomSheetBackdrop: () => null,
    BottomSheetTextInput: require('react-native').TextInput,
  };
});
