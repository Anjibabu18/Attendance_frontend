import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export function VDLogo({ size = 120 }: { size?: number }) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%" overflow="visible">
        <defs>
          {/* Silver gradient for V */}
          <linearGradient id="vd-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#e2e8f0" />
            <stop offset="60%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Gold gradient for D */}
          <linearGradient id="vd-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#facc15" />
            <stop offset="65%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* Neon blue ring gradient */}
          <linearGradient id="vd-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Outer glow for V */}
          <filter id="vd-glow-v" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Outer glow for D */}
          <filter id="vd-glow-d" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Ring glow filter */}
          <filter id="vd-glow-ring" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dark glass bg */}
          <radialGradient id="vd-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          <clipPath id="vd-circle-clip">
            <circle cx="100" cy="100" r="88" />
          </clipPath>
        </defs>

        {/* Dark glass background circle */}
        <circle cx="100" cy="100" r="90" fill="url(#vd-bg)" />

        {/* Animated gradient ring */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#vd-ring)"
          strokeWidth="3"
          strokeDasharray="565"
          strokeLinecap="round"
          filter="url(#vd-glow-ring)"
          initial={{ strokeDashoffset: 565, opacity: 0 }}
          animate={{ strokeDashoffset: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Second inner ring (thin) */}
        <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1" />

        {/* Shimmer highlight at top */}
        <ellipse cx="100" cy="62" rx="38" ry="14" fill="rgba(255,255,255,0.06)" />

        {/* === V letter === */}
        <motion.text
          x="22"
          y="142"
          fontFamily='"Georgia", "Times New Roman", serif'
          fontSize="116"
          fontWeight="bold"
          fill="url(#vd-silver)"
          filter="url(#vd-glow-v)"
          clipPath="url(#vd-circle-clip)"
          style={{ letterSpacing: '-0.06em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          V
        </motion.text>

        {/* === D letter === */}
        <motion.text
          x="90"
          y="142"
          fontFamily='"Georgia", "Times New Roman", serif'
          fontSize="116"
          fontWeight="bold"
          fill="url(#vd-gold)"
          filter="url(#vd-glow-d)"
          clipPath="url(#vd-circle-clip)"
          style={{ letterSpacing: '-0.06em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.18 }}
        >
          D
        </motion.text>

        {/* Decorative dots at bottom */}
        <motion.circle cx="78" cy="170" r="2.5" fill="#38bdf8" opacity="0.7"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
        <motion.circle cx="100" cy="174" r="2.5" fill="#818cf8" opacity="0.7"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} />
        <motion.circle cx="122" cy="170" r="2.5" fill="#c084fc" opacity="0.7"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
      </svg>
    </Box>
  );
}
