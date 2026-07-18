import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../theme/ThemeContext';
import { VDLogo } from './VDLogo';

export function GlobalLoader({ message = "Loading Workspace..." }: { message?: string }) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at 50% 40%, #0f1f3d 0%, #050814 100%)'
          : 'radial-gradient(ellipse at 50% 40%, #dbeafe 0%, #f0f7ff 100%)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Background moving orb 1 */}
      <Box
        component={motion.div}
        animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.45, 0.25], x: [0, 30, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        sx={{
          position: 'absolute',
          width: '50vw', height: '50vw',
          maxWidth: 480, maxHeight: 480,
          background: isDark
            ? 'radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          top: '5%', left: '5%',
          pointerEvents: 'none',
        }}
      />

      {/* Background moving orb 2 */}
      <Box
        component={motion.div}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.35, 0.2], x: [0, -20, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        sx={{
          position: 'absolute',
          width: '40vw', height: '40vw',
          maxWidth: 380, maxHeight: 380,
          background: isDark
            ? 'radial-gradient(circle, rgba(192,132,252,0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          bottom: '8%', right: '8%',
          pointerEvents: 'none',
        }}
      />

      {/* Spinning outer ring */}
      <Box
        component={motion.div}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        sx={{
          position: 'absolute',
          width: 220, height: 220,
          borderRadius: '50%',
          border: '1px solid transparent',
          borderTop: '1px solid rgba(56,189,248,0.6)',
          borderRight: '1px solid rgba(192,132,252,0.4)',
          pointerEvents: 'none',
        }}
      />

      {/* Spinning inner ring (reverse) */}
      <Box
        component={motion.div}
        animate={{ rotate: -360 }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        sx={{
          position: 'absolute',
          width: 180, height: 180,
          borderRadius: '50%',
          border: '1px dashed rgba(56,189,248,0.2)',
          pointerEvents: 'none',
        }}
      />

      {/* VD Logo */}
      <Box
        component={motion.div}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        sx={{ position: 'relative', zIndex: 1, mb: 4 }}
      >
        <VDLogo size={130} />
      </Box>

      {/* Brand name */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 1 }}
      >
        <Typography
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: isDark ? '#f8fafc' : '#0f172a',
            fontFamily: '"Georgia", serif',
          }}
        >
          Work<Box component="span" sx={{
            background: 'linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Track</Box>
        </Typography>
      </Box>

      {/* Message text */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 5 }}
      >
        <Typography
          sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: isDark ? '#64748b' : '#94a3b8',
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* Animated progress dots */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        sx={{ position: 'relative', zIndex: 1, display: 'flex', gap: 1.2 }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <Box
            key={i}
            component={motion.div}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
              backgroundColor: isDark
                ? ['#38bdf8', '#818cf8', '#c084fc'][i % 3]
                : ['#2563eb', '#7c3aed', '#0f766e'][i % 3],
            }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
            sx={{ width: 7, height: 7, borderRadius: '50%' }}
          />
        ))}
      </Box>
    </Box>
  );
}
