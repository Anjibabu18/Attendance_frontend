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
        
        {/* SVG Liquid Orb Effect */}
        <svg width="0" height="0">
          <defs>
            <filter id="liquid-filter">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10" result="liquid" />
              <feBlend in="SourceGraphic" in2="liquid" />
            </filter>
            
            <linearGradient id="orb-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isDark ? "#38bdf8" : "#3b82f6"} />
              <stop offset="50%" stopColor={isDark ? "#818cf8" : "#6366f1"} />
              <stop offset="100%" stopColor={isDark ? "#c084fc" : "#8b5cf6"} />
            </linearGradient>
          </defs>
        </svg>

        <Box 
          sx={{ 
            position: 'absolute',
            inset: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: 'url(#liquid-filter)',
          }}
        >
          {/* Main Core */}
          <Box
            component={motion.div}
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: 360,
              borderRadius: ["50% 50% 50% 50%", "40% 60% 60% 40%", "50% 50% 50% 50%"]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            sx={{
              position: 'absolute',
              width: 80,
              height: 80,
              background: `linear-gradient(135deg, ${isDark ? '#38bdf8, #818cf8' : '#3b82f6, #6366f1'})`,
              boxShadow: isDark ? '0 0 40px rgba(56, 189, 248, 0.4)' : '0 0 40px rgba(59, 130, 246, 0.4)',
            }}
          />

          {/* Orbiting Blobs for Liquid Fusion */}
          {[...Array(3)].map((_, i) => (
            <Box
              key={i}
              component={motion.div}
              animate={{ 
                rotate: 360,
              }}
              transition={{ 
                duration: 2.5 + i, 
                repeat: Infinity, 
                ease: "linear",
                delay: i * 0.5 
              }}
              sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
              }}
            >
              <Box
                component={motion.div}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${isDark ? '#c084fc, #38bdf8' : '#8b5cf6, #3b82f6'})`,
                }}
              />
            </Box>
          ))}
        </Box>
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
