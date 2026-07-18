import React from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

export function VDLogo({ size = 120 }: { size?: number }) {
  return (
    <Box
      component={motion.div}
      animate={{ 
        scale: [0.97, 1.03, 0.97],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))',
      }}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%">
        <defs>
          <linearGradient id="silver-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
          
          <filter id="glow-silver">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="glow-gold">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* The V (Silver) */}
        <motion.text 
          x="26" 
          y="88" 
          fontFamily='"Times New Roman", Times, serif' 
          fontSize="82" 
          fontWeight="bold" 
          fill="url(#silver-grad)" 
          filter="url(#glow-silver)"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ letterSpacing: "-0.05em" }}
        >
          V
        </motion.text>
        
        {/* The D (Gold) */}
        <motion.text 
          x="62" 
          y="88" 
          fontFamily='"Times New Roman", Times, serif' 
          fontSize="82" 
          fontWeight="bold" 
          fill="url(#gold-grad)"
          filter="url(#glow-gold)"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        >
          D
        </motion.text>
      </svg>
    </Box>
  );
}
