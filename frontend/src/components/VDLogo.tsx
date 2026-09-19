import React from 'react';
import { AppLogo } from './AppLogo';

export function VDLogo({ size = 120, animated = true }: { size?: number; animated?: boolean }) {
  return <AppLogo size={size} animated={animated} glow={true} />;
}
