import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import FmdGoodRoundedIcon from '@mui/icons-material/FmdGoodRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import RadioButtonCheckedRoundedIcon from '@mui/icons-material/RadioButtonCheckedRounded';
import { motion } from 'framer-motion';

import { OfficeLocation } from '../types';
import { useThemeContext } from '../theme/ThemeContext';
import { hapticPop, hapticTap } from '../utils/haptics';

interface LiveGeofenceRadarProps {
  assignedOffice?: OfficeLocation | null;
  onStatusChange?: (inside: boolean, distanceMeters: number) => void;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function LiveGeofenceRadar({ assignedOffice, onStatusChange }: LiveGeofenceRadarProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';

  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Default fallback office if employee has no office assigned yet
  const office = assignedOffice || {
    id: 1,
    officeName: 'Tech Park Campus',
    latitude: 12.9716,
    longitude: 77.5946,
    radiusMeters: 120,
  };

  const acquireLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userCoords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        };
        setCoords(userCoords);
        setLoading(false);
        setLastRefreshed(new Date());

        if (office) {
          const dist = haversineDistance(userCoords.lat, userCoords.lng, office.latitude, office.longitude);
          const isInside = dist <= office.radiusMeters;
          onStatusChange?.(isInside, dist);
        }
      },
      (err) => {
        // Fallback or demo simulation if user blocked GPS permissions
        setError(err.message || 'GPS Signal unavailable');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }, [office, onStatusChange]);

  useEffect(() => {
    acquireLocation();
    const interval = setInterval(acquireLocation, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [acquireLocation]);

  const distance = coords && office
    ? haversineDistance(coords.lat, coords.lng, office.latitude, office.longitude)
    : null;

  const isInside = distance !== null && distance <= (office.radiusMeters || 100);

  const formattedDistance =
    distance !== null
      ? distance < 1000
        ? `${distance}m`
        : `${(distance / 1000).toFixed(2)} km`
      : '--';

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: '20px',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : '#ffffff',
        border: `1px solid ${
          isInside
            ? isDark
              ? 'rgba(16, 185, 129, 0.35)'
              : '#bbf7d0'
            : isDark
            ? 'rgba(245, 158, 11, 0.35)'
            : '#fed7aa'
        }`,
        boxShadow: isDark
          ? isInside
            ? '0 12px 36px rgba(16, 185, 129, 0.1)'
            : '0 12px 36px rgba(245, 158, 11, 0.08)'
          : isInside
          ? '0 6px 24px -2px rgba(16, 185, 129, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)'
          : '0 6px 24px -2px rgba(245, 158, 11, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Radar Rings */}
      <Box
        sx={{
          position: 'absolute',
          right: -25,
          bottom: -25,
          width: 170,
          height: 170,
          borderRadius: '50%',
          border: `1.5px dashed ${isInside ? (isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)') : (isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.25)')}`,
          pointerEvents: 'none',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            border: `1px solid ${isInside ? (isDark ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)') : (isDark ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.2)')}`,
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 55,
            height: 55,
            borderRadius: '50%',
            backgroundColor: isInside ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          }}
        />
      </Box>

      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: isInside
                ? isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5'
                : isDark ? 'rgba(245, 158, 11, 0.16)' : '#fffbeb',
              border: `1px solid ${isInside ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0') : (isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a')}`,
              display: 'grid',
              placeItems: 'center',
              color: isInside ? (isDark ? '#34d399' : '#059669') : (isDark ? '#fbbf24' : '#d97706'),
            }}
          >
            <RadioButtonCheckedRoundedIcon sx={{ fontSize: 21 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2, color: 'text.primary' }}>
              Office Geofence Radar
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.3, fontWeight: 500 }}>
              Target: <strong style={{ color: isDark ? '#f1f5f9' : '#334155' }}>{office.officeName || 'Assigned Office'}</strong> ({office.radiusMeters}m radius)
            </Typography>
          </Box>
        </Box>

        <Tooltip title="Recalibrate GPS Location" arrow>
          <IconButton
            onClick={() => {
              hapticTap();
              acquireLocation();
            }}
            disabled={loading}
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}`,
              '&:hover': {
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#f1f5f9',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={16} sx={{ color: isInside ? '#10b981' : '#f59e0b' }} />
            ) : (
              <RefreshRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Main Status & Distance Info */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            component={motion.div}
            animate={{
              scale: isInside ? [1, 1.25, 1] : [1, 1.15, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            sx={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              bgcolor: isInside ? '#10b981' : '#f59e0b',
              boxShadow: isInside ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
              flexShrink: 0,
            }}
          />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 14,
                color: isInside ? (isDark ? '#34d399' : '#059669') : (isDark ? '#fbbf24' : '#d97706'),
              }}
            >
              {loading
                ? 'Acquiring GPS Signal...'
                : isInside
                ? 'Within Office Geofence'
                : 'Outside Office Geofence'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 500 }}>
              {loading
                ? 'Connecting to satellites...'
                : isInside
                ? `${formattedDistance} away · 1-Tap Onsite Punch Enabled`
                : `${formattedDistance} away · Remote / WFH Mode Active`}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {coords && (
            <Chip
              label={`±${coords.accuracy}m accuracy`}
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 700,
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
                color: isDark ? '#94a3b8' : '#475569',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              }}
            />
          )}
          <Chip
            label={isInside ? 'Onsite' : 'Remote'}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: isInside
                ? isDark ? 'rgba(16, 185, 129, 0.16)' : '#dcfce7'
                : isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
              color: isInside
                ? isDark ? '#34d399' : '#15803d'
                : isDark ? '#fbbf24' : '#b45309',
              border: `1px solid ${isInside ? (isDark ? 'rgba(16, 185, 129, 0.35)' : '#86efac') : (isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a')}`,
            }}
          />
        </Box>
      </Box>

      {error && (
        <Typography sx={{ fontSize: 11, color: 'text.disabled', mt: 1 }}>
          Notice: {error} (Using cached office radius)
        </Typography>
      )}
    </Box>
  );
}
