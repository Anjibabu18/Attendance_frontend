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
        background: isDark
          ? isInside
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.7) 100%)'
          : isInside
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(255, 255, 255, 0.9) 100%)',
        border: `1px solid ${
          isInside
            ? isDark
              ? 'rgba(16, 185, 129, 0.25)'
              : 'rgba(16, 185, 129, 0.3)'
            : isDark
            ? 'rgba(245, 158, 11, 0.25)'
            : 'rgba(245, 158, 11, 0.3)'
        }`,
        boxShadow: isDark
          ? isInside
            ? '0 12px 36px rgba(16, 185, 129, 0.08)'
            : '0 12px 36px rgba(245, 158, 11, 0.06)'
          : '0 8px 30px rgba(0, 0, 0, 0.04)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Radar Rings */}
      <Box
        sx={{
          position: 'absolute',
          right: -30,
          bottom: -30,
          width: 180,
          height: 180,
          borderRadius: '50%',
          border: `1px dashed ${isInside ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
          pointerEvents: 'none',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <Box
          sx={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: `1px solid ${isInside ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: '50%',
            backgroundColor: isInside ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          }}
        />
      </Box>

      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isInside
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(245, 158, 11, 0.15)',
              display: 'grid',
              placeItems: 'center',
              color: isInside ? '#10b981' : '#f59e0b',
            }}
          >
            <RadioButtonCheckedRoundedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 15, lineHeight: 1.1 }}>
              Office Geofence Radar
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25 }}>
              Target: {office.officeName || 'Assigned Office'} ({office.radiusMeters}m radius)
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
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`,
            }}
          >
            {loading ? (
              <CircularProgress size={16} sx={{ color: isInside ? '#10b981' : '#f59e0b' }} />
            ) : (
              <RefreshRoundedIcon fontSize="small" />
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
              scale: isInside ? [1, 1.2, 1] : [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: isInside ? '#10b981' : '#f59e0b',
              boxShadow: isInside ? '0 0 10px #10b981' : '0 0 10px #f59e0b',
            }}
          />
          <Box>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: 14,
                color: isInside ? '#10b981' : '#f59e0b',
              }}
            >
              {loading
                ? 'Acquiring GPS Signal...'
                : isInside
                ? 'Within Office Geofence'
                : 'Outside Office Geofence'}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
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
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                color: 'text.secondary',
              }}
            />
          )}
          <Chip
            label={isInside ? 'Onsite' : 'Remote'}
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: isInside ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isInside ? '#10b981' : '#f59e0b',
              border: `1px solid ${isInside ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
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
