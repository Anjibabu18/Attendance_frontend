import React from 'react';
import { Box, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { useThemeContext } from '../theme/ThemeContext';

export function LayoutSkeleton() {
  const { mode } = useThemeContext();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '280px 1fr' }, minHeight: '100vh' }}>
        
        {/* Sidebar Skeleton */}
        <Box
          component={motion.aside}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          sx={{
            display: { xs: 'none', md: 'flex' }, position: 'sticky', top: 0, height: '100vh',
            flexDirection: 'column', p: 2.5, gap: 2,
            bgcolor: 'background.paper',
            borderRight: '1px solid', borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1, py: 1.25 }}>
            <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: '8px' }} />
            <Box>
              <Skeleton variant="text" width={100} height={24} />
              <Skeleton variant="text" width={140} height={16} />
            </Box>
          </Box>
          <Box sx={{ display: 'grid', gap: 0.85, mt: 1 }}>
            {[1, 2, 3, 4].map(i => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.3, py: 1.15 }}>
                <Skeleton variant="circular" width={24} height={24} />
                <Box>
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="text" width={150} height={14} />
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ mt: 'auto', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.default', display: 'flex', gap: 1.25, alignItems: 'center' }}>
            <Skeleton variant="circular" width={42} height={42} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="80%" height={20} />
              <Skeleton variant="text" width="40%" height={14} />
            </Box>
          </Box>
        </Box>

        {/* Main Content Skeleton */}
        <Box component="main" sx={{ minWidth: 0, pb: { xs: 9, md: 0 } }}>
          
          {/* Header Skeleton */}
          <Box sx={{ position: 'sticky', top: 0, zIndex: 20, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, sm: 3 }, py: { xs: 1.5, md: 2 } }}>
              <Box>
                <Skeleton variant="text" width={160} height={32} sx={{ mb: 0.5 }} />
                <Skeleton variant="text" width={200} height={16} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                <Skeleton variant="rounded" width={100} height={40} sx={{ borderRadius: '8px', display: { xs: 'none', sm: 'block' } }} />
                <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '10px' }} />
                <Skeleton variant="circular" width={40} height={40} sx={{ display: { md: 'none' } }} />
              </Box>
            </Box>
          </Box>

          {/* Body Skeleton */}
          <Box sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, md: 3 } }}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              
              <Box sx={{ display: 'grid', gap: 2.5 }}>
                {/* Hero Skeleton */}
                <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Skeleton variant="text" width={180} height={24} sx={{ mb: 2 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    {[1, 2, 3, 4].map(i => (
                      <Box key={i}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width={100} height={32} />
                        <Skeleton variant="text" width={120} height={16} />
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Cards Skeleton */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 2.5 }}>
                  <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', minHeight: 320 }}>
                    <Skeleton variant="text" width={200} height={28} sx={{ mb: 3 }} />
                    <Skeleton variant="rounded" width="100%" height={240} sx={{ borderRadius: '12px' }} />
                  </Box>
                  <Box sx={{ p: { xs: 2, md: 3 }, borderRadius: '16px', bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                    <Skeleton variant="text" width={150} height={28} sx={{ mb: 3 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {[1, 2, 3].map(i => (
                        <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Skeleton variant="circular" width={48} height={48} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="80%" height={20} />
                            <Skeleton variant="text" width="50%" height={16} />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>

              </Box>

            </motion.div>
          </Box>
        </Box>
      </Box>

      {/* Mobile Nav Skeleton */}
      <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, px: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: '8px', height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-around', px: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width={40} height={12} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
