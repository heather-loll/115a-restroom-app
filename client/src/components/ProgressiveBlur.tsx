import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { BlurView, BlurTint } from 'expo-blur';
import MaskedViewRaw, { MaskedViewProps } from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Fix for TS2786 outdated type definitions
const MaskedView = MaskedViewRaw as unknown as React.ComponentType<MaskedViewProps>;

interface ProgressiveBlurProps {
  direction?: 'top-to-bottom' | 'bottom-to-top';
  intensity?: number;
  tint?: BlurTint;
  style?: StyleProp<ViewStyle>;
}

export function ProgressiveBlur({
  direction = 'top-to-bottom',
  intensity = 40,
  tint = 'default',
  style,
}: ProgressiveBlurProps) {
  const colors =
    direction === 'top-to-bottom'
      ? (['black', 'black', 'transparent'] as const)
      : (['transparent', 'black', 'black'] as const);

  const locations = direction === 'top-to-bottom' ? ([0, 0.4, 1] as const) : ([0, 0.6, 1] as const);
  return (
    <MaskedView
      pointerEvents="none"
      style={[styles.overlay, style]}
      maskElement={
        <LinearGradient colors={colors} locations={locations} style={StyleSheet.absoluteFill} />
      }>
      <BlurView
        intensity={intensity}
        tint={tint}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
});
