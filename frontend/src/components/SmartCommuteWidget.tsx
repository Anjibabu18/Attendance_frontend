import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded';
import DirectionsSubwayRoundedIcon from '@mui/icons-material/DirectionsSubwayRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import ThunderstormRoundedIcon from '@mui/icons-material/ThunderstormRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import TrafficRoundedIcon from '@mui/icons-material/TrafficRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { hapticPop, hapticTap } from '../utils/haptics';
import { formatShiftTime, formatShiftTime12h } from '../utils/timeFormat';

interface SmartCommuteWidgetProps {
  officeName?: string;
  shiftStartTime?: string; // e.g. "09:00 AM" or "09:00"
  userAddress?: string;
}

export function SmartCommuteWidget({
  officeName = 'Main Office',
  shiftStartTime = '09:00 AM',
  userAddress = 'Home',
}: SmartCommuteWidgetProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [travelMode, setTravelMode] = useState<'drive' | 'transit' | 'walk'>('drive');

  // Commute stats based on selected mode
  const commuteDetails = useMemo(() => {
    switch (travelMode) {
      case 'drive':
        return {
          durationMin: 22,
          distance: '9.4 km',
          trafficLevel: 'Moderate',
          trafficColor: '#f59e0b',
          departureLeadMin: 28,
        };
      case 'transit':
        return {
          durationMin: 34,
          distance: '11.2 km',
          trafficLevel: 'On Schedule (Metro)',
          trafficColor: '#10b981',
          departureLeadMin: 42,
        };
      case 'walk':
        return {
          durationMin: 75,
          distance: '5.8 km',
          trafficLevel: 'Clear Footpath',
          trafficColor: '#38bdf8',
          departureLeadMin: 85,
        };
    }
  }, [travelMode]);

  // Calculate target departure time based on shift start
  const departureRecommendation = useMemo(() => {
    const today = dayjs();
    const cleanTime = formatShiftTime(shiftStartTime, '09:00');
    const [hStr, mStr] = cleanTime.split(':');
    const hour = parseInt(hStr, 10) || 9;
    const minute = parseInt(mStr, 10) || 0;
    const shiftDate = today.hour(hour).minute(minute).second(0);
    const departureTime = shiftDate.subtract(commuteDetails.departureLeadMin, 'minute');
    return departureTime.format('hh:mm A');
  }, [shiftStartTime, commuteDetails.departureLeadMin]);

  const handleOpenMaps = () => {
    hapticTap();
    const query = encodeURIComponent(`${officeName}`);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 12px 32px rgba(15, 23, 42, 0.05)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background subtle radial glow */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(14, 165, 233, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 2,
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.1)',
              color: '#38bdf8',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <NavigationRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
              Smart Commute & Transit Assistant
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
              Live transit timing to {officeName}
            </Typography>
          </Box>
        </Box>

        {/* Travel mode switcher */}
        <Box
          sx={{
            display: 'flex',
            p: 0.5,
            borderRadius: '12px',
            bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
            border: '1px solid',
            borderColor: 'divider',
            gap: 0.5,
          }}
        >
          <Tooltip title="Drive / Cab">
            <IconButton
              size="small"
              onClick={() => {
                hapticPop();
                setTravelMode('drive');
              }}
              sx={{
                borderRadius: '8px',
                bgcolor: travelMode === 'drive' ? (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe') : 'transparent',
                color: travelMode === 'drive' ? '#0284c7' : 'text.secondary',
              }}
            >
              <DirectionsCarRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Public Transit / Metro">
            <IconButton
              size="small"
              onClick={() => {
                hapticPop();
                setTravelMode('transit');
              }}
              sx={{
                borderRadius: '8px',
                bgcolor: travelMode === 'transit' ? (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe') : 'transparent',
                color: travelMode === 'transit' ? '#0284c7' : 'text.secondary',
              }}
            >
              <DirectionsSubwayRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Walk">
            <IconButton
              size="small"
              onClick={() => {
                hapticPop();
                setTravelMode('walk');
              }}
              sx={{
                borderRadius: '8px',
                bgcolor: travelMode === 'walk' ? (isDark ? 'rgba(56, 189, 248, 0.2)' : '#e0f2fe') : 'transparent',
                color: travelMode === 'walk' ? '#0284c7' : 'text.secondary',
              }}
            >
              <DirectionsWalkRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Main recommendation banner */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' },
          gap: 2,
          p: 2,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(56, 189, 248, 0.06)' : 'rgba(2, 132, 199, 0.04)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(2, 132, 199, 0.15)',
          mb: 2,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
            <AccessTimeRoundedIcon sx={{ fontSize: 16, color: '#0284c7' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Suggested Departure
            </Typography>
          </Box>
          <Typography sx={{ fontSize: { xs: 26, sm: 30 }, fontWeight: 900, color: '#0284c7', lineHeight: 1 }}>
            {departureRecommendation}
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.75, fontWeight: 600 }}>
            Leave {userAddress} by this time to arrive smoothly by <b>{formatShiftTime12h(shiftStartTime)}</b>
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 700 }}>Duration:</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 900 }}>~{commuteDetails.durationMin} mins ({commuteDetails.distance})</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 700 }}>Live Traffic:</Typography>
            <Chip
              size="small"
              icon={<TrafficRoundedIcon sx={{ fontSize: '13px !important' }} />}
              label={commuteDetails.trafficLevel}
              sx={{
                fontWeight: 800,
                fontSize: 11,
                bgcolor: `${commuteDetails.trafficColor}18`,
                color: commuteDetails.trafficColor,
                border: `1px solid ${commuteDetails.trafficColor}30`,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Weather context & Google Maps button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
              color: '#f59e0b',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <WbSunnyRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
              26°C · Mostly Sunny
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              Clear skies for morning commute · 20% rain chance around 6 PM
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={handleOpenMaps}
          startIcon={<NavigationRoundedIcon fontSize="small" />}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 12,
            width: { xs: '100%', sm: 'auto' },
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              borderColor: '#0284c7',
              bgcolor: isDark ? 'rgba(2, 132, 199, 0.1)' : 'rgba(2, 132, 199, 0.05)',
            },
          }}
        >
          Open Navigation
        </Button>
      </Box>
    </Box>
  );
}
