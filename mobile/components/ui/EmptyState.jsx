import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Typography } from '../../constants';
import { Button } from './Button';

export function EmptyState({ icon, title, description, actionLabel, onAction }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}>
      {icon && <Text style={{ fontSize: 56 }}>{icon}</Text>}
      <Text style={{ fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, color: Colors.textPrimary, textAlign: 'center' }}>{title}</Text>
      {description && <Text style={{ fontSize: Typography.sizes.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 }}>{description}</Text>}
      {actionLabel && onAction && <Button title={actionLabel} onPress={onAction} fullWidth={false} style={{ marginTop: 8, paddingHorizontal: 32 }} />}
    </View>
  );
}