import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export interface AppLogoProps {
  size?: number;
  animated?: boolean;
  glow?: boolean;
  className?: string;
}

export function AppLogo({
  size = 48,
  animated = false,
  glow = true,
  className,
}: AppLogoProps) {
  return (
    <Box
      className={className}
      component={animated ? motion.div : 'div'}
      {...(animated
        ? {
            whileHover: { scale: 1.05, rotate: -2 },
            whileTap: { scale: 0.95 },
            transition: { type: 'spring', stiffness: 400, damping: 20 },
          }
        : {})}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        userSelect: 'none',
        filter: glow ? 'drop-shadow(0 8px 24px rgba(37, 99, 235, 0.28))' : 'none',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Main squircle badge background */}
          <linearGradient id="applogo-bg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Border accent */}
          <linearGradient id="applogo-border" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.2" />
          </linearGradient>

          {/* Checkmark vibrant stroke */}
          <linearGradient id="applogo-check" x1="28" y1="34" x2="74" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Chronometer arc ring */}
          <linearGradient id="applogo-arc" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>

          {/* Inner shadow filter */}
          <filter id="applogo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Squircle base */}
        <rect
          x="5"
          y="5"
          width="90"
          height="90"
          rx="24"
          fill="url(#applogo-bg)"
          stroke="url(#applogo-border)"
          strokeWidth="2.5"
        />

        {/* Top inner glass sheen highlight */}
        <path
          d="M 16 18 C 30 11, 70 11, 84 18 C 76 28, 24 28, 16 18 Z"
          fill="white"
          fillOpacity="0.09"
        />

        {/* Chronometer circular track (representing real-time punch & time accuracy) */}
        <path
          d="M 26 50 A 24 24 0 1 1 50 74"
          stroke="url(#applogo-arc)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="95 30"
          opacity="0.8"
        />

        {/* Small 12-o'clock precision notch */}
        <circle cx="50" cy="26" r="2.2" fill="#93C5FD" />

        {/* Main signature checkmark (representing verified check-in & attendance) */}
        <path
          d="M 31 52 L 44 65 L 71 36"
          stroke="url(#applogo-check)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#applogo-glow)"
        />

        {/* Live status beacon node at the tip of checkmark */}
        <circle cx="71" cy="36" r="3.2" fill="#38BDF8" />
        {animated && (
          <motion.circle
            cx="71"
            cy="36"
            r="6"
            stroke="#38BDF8"
            strokeWidth="1.5"
            fill="none"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </svg>
    </Box>
  );
}
