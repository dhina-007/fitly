import React from 'react';
import * as LucideIcons from 'lucide-react-native';
import { Colors } from '../../constants';

/**
 * Centralized Icon component around lucide-react-native.
 * Enforces standard sizes (xs:14, sm:18, md:22, lg:26, xl:32) and consistent stroke widths.
 */
export function Icon({ name, size = 20, color = Colors.textPrimary, strokeWidth = 2, style, ...props }) {
  const IconComponent = LucideIcons[name] || LucideIcons.HelpCircle;

  return (
    <IconComponent
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style}
      {...props}
    />
  );
}

export default Icon;
