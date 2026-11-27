import { useState } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Check, LucideIcon } from 'lucide-react-native';

interface ToggleCardProps {
  id: AmenityId;
  label: string;
  icon: LucideIcon;
  updateAmenities: (id: AmenityId, checked: boolean) => void;
}

export default function ToggleCard({ id, label, icon, updateAmenities }: ToggleCardProps) {
  const [checked, setChecked] = useState(false);

  const Icon = icon;

  return (
    <Pressable
      style={[styles.card, checked ? styles.cardChecked : {}]}
      // android_ripple={{ color: !checked ? '#ffffff50' : '#0099331a', foreground: true }}
      onPress={() => {
        updateAmenities(id, !checked);
        setChecked(!checked);
      }}>
      <Icon size={32} style={styles.cardIcon} />
      <Text style={styles.cardLabel}>{label}</Text>

      {label === 'Customers Only' && <Text style={styles.cardSubLabel}>(Code Required)</Text>}

      <View style={[styles.cardCheckbox, checked ? styles.cardCheckboxChecked : {}]}>
        {checked && <Check size={16} strokeWidth={3} color="white" />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderColor: '#dddddd',
    borderWidth: 2,
    borderRadius: 12,
    paddingBlock: 16,
    paddingInline: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardChecked: {
    borderColor: '#009966',
    backgroundColor: '#00996620',
  },
  cardIcon: {
    marginBottom: 8,
    color: 'black',
  },
  cardLabel: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 500,
  },
  cardSubLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 400,
    opacity: 0.5,
  },
  cardCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#dddddd',
    position: 'absolute',
    top: 6,
    right: 6,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardCheckboxChecked: {
    backgroundColor: '#009966',
    borderColor: '#009966',
  },
});
