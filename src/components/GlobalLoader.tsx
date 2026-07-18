import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../theme/ThemeContext';

export function GlobalLoader({ message = "Loading Workspace..." }: { message?: string }) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: "easeInOut" } }}
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDark ? 'rgba(5, 8, 20, 0.85)' : 'rgba(240, 245, 255, 0.7)',
        backdropFilter: 'blur(30px) saturate(150%)',
        WebkitBackdropFilter: 'blur(30px) saturate(150%)',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow matching the orb */}
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        sx={{
          position: 'absolute',
          width: '60vw',
          height: '60vw',
          maxHeight: 600,
          maxWidth: 600,
          background: isDark 
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)' 
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(255,255,255,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', width: 140, height: 140, mb: 6, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        <Box
          component={motion.img}
          src="/vd-logo.png"
          alt="VD Logo"
          animate={{ 
            scale: [0.95, 1.05, 0.95], 
            opacity: [0.8, 1, 0.8] 
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          sx={{
            width: 120,
            height: 'auto',
            filter: isDark ? 'drop-shadow(0 0 25px rgba(255, 255, 255, 0.25))' : 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.2))',
          }}
        />
      </Box>

      {/* Shimmering Text */}
      <Box sx={{ position: 'relative' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '0.05em',
            color: 'transparent',
            WebkitTextStroke: isDark ? '1px rgba(255,255,255,0.1)' : '1px rgba(0,0,0,0.1)',
            position: 'absolute',
            inset: 0,
            textAlign: 'center'
          }}
        >
          {message}
        </Typography>
        
        <Typography
          component={motion.div}
          animate={{ backgroundPosition: ['200% center', '-200% center'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '0.05em',
            textAlign: 'center',
            background: isDark 
              ? 'linear-gradient(90deg, #94a3b8 0%, #f8fafc 20%, #f8fafc 80%, #94a3b8 100%)' 
              : 'linear-gradient(90deg, #64748b 0%, #0f172a 20%, #0f172a 80%, #64748b 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: isDark ? 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' : 'none',
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
}
