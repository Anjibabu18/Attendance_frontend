import React from 'react';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export function EmptyState({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <Box
      sx={{
        p: 4,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250,
        bgcolor: 'background.paper',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 32px rgba(0,0,0,0.02)'
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        style={{ marginBottom: 16 }}
      >
        <Box sx={{
          width: 80, height: 80, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(37,99,235,0.05)', color: '#3b82f6',
          boxShadow: '0 0 40px rgba(37,99,235,0.1)'
        }}>
          {icon}
        </Box>
      </motion.div>
      <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 0.75 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 300 }}>{description}</Typography>
    </Box>
  );
}
