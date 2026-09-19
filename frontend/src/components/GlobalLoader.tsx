import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../theme/ThemeContext';
import { AppLogo } from './AppLogo';

export function GlobalLoader({ message = "Loading Workspace..." }: { message?: string }) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.25, ease: "easeOut" } }}
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDark
          ? 'radial-gradient(ellipse at 50% 45%, #0d1a33 0%, #060b17 100%)'
          : 'radial-gradient(ellipse at 50% 45%, #e0f2fe 0%, #f8fafc 100%)',
        zIndex: 9999,
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Ambient background glow */}
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.15, 1],
          opacity: isDark ? [0.25, 0.4, 0.25] : [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        sx={{
          position: 'absolute',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(56,189,248,0.22) 0%, rgba(99,102,241,0.1) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(14,165,233,0.12) 50%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* App Logo with subtle breathing aura */}
      <Box
        component={motion.div}
        animate={{
          scale: [1, 1.04, 1],
          y: [0, -3, 0],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        sx={{
          position: 'relative',
          zIndex: 1,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLogo size={92} animated={false} glow={true} />
      </Box>

      {/* Brand Title */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 0.5 }}
      >
        <Typography
          sx={{
            fontSize: { xs: '1.4rem', sm: '1.65rem' },
            fontWeight: 900,
            letterSpacing: '-0.025em',
            color: isDark ? '#f8fafc' : '#0f172a',
            lineHeight: 1.15,
          }}
        >
          Work<Box
            component="span"
            sx={{
              background: 'linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #818CF8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Track
          </Box>
        </Typography>
      </Box>

      {/* Status Message */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.3 }}
        sx={{ position: 'relative', zIndex: 1, textAlign: 'center', mb: 3 }}
      >
        <Typography
          sx={{
            fontSize: '0.8rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isDark ? '#64748b' : '#64748b',
          }}
        >
          {message}
        </Typography>
      </Box>

      {/* Sleek modern indeterminate progress line */}
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: 140,
          height: 3.5,
          borderRadius: 4,
          bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <Box
          component={motion.div}
          animate={{
            x: [-140, 140],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: [0.4, 0, 0.2, 1],
          }}
          sx={{
            width: '60%',
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(90deg, transparent, #38BDF8, #818CF8, transparent)',
          }}
        />
      </Box>
    </Box>
  );
}
export default GlobalLoader;
