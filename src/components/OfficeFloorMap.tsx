import React, { useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import ChairRoundedIcon from '@mui/icons-material/ChairRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import LaptopMacRoundedIcon from '@mui/icons-material/LaptopMacRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

interface DeskMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
  status: 'DESK' | 'MEETING' | 'COFFEE' | 'REMOTE';
  deskId: string;
  zone: 'Engineering' | 'Product' | 'Executive' | 'Lounge';
  checkInTime: string;
}

interface OfficeFloorMapProps {
  currentEmployee?: any;
  isPunchedIn?: boolean;
}

export function OfficeFloorMap({ currentEmployee, isPunchedIn = false }: OfficeFloorMapProps = {}) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [activeZone, setActiveZone] = useState<string>('ALL');
  const [selectedMember, setSelectedMember] = useState<DeskMember | null>(null);

  const teamList: DeskMember[] = [
    {
      id: '1',
      name: currentEmployee?.name || 'Venkata Rao',
      role: currentEmployee?.companyRole?.name || 'Lead Architect',
      initials: currentEmployee?.name
        ? currentEmployee.name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
        : 'VR',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      deskId: 'E-01',
      zone: 'Engineering',
      status: isPunchedIn ? 'DESK' : 'DESK',
      checkInTime: '09:15 AM',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      role: 'Staff Product Manager',
      initials: 'PS',
      gradient: 'linear-gradient(135deg, #EC4899 0%, #D946EF 100%)',
      deskId: 'P-04',
      zone: 'Product',
      status: 'MEETING',
      checkInTime: '09:28 AM',
    },
    {
      id: '3',
      name: 'Rahul Verma',
      role: 'Senior Frontend Dev',
      initials: 'RV',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
      deskId: 'E-02',
      zone: 'Engineering',
      status: 'COFFEE',
      checkInTime: '09:40 AM',
    },
    {
      id: '4',
      name: 'Anita Patel',
      role: 'Principal Designer',
      initials: 'AP',
      gradient: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)',
      deskId: 'P-01',
      zone: 'Product',
      status: 'DESK',
      checkInTime: '09:10 AM',
    },
    {
      id: '5',
      name: 'Vikram Singh',
      role: 'HR Director',
      initials: 'VS',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
      deskId: 'X-01',
      zone: 'Executive',
      status: 'DESK',
      checkInTime: '09:05 AM',
    },
    {
      id: '6',
      name: 'Kavita Reddy',
      role: 'Backend Engineer',
      initials: 'KR',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      deskId: 'E-03',
      zone: 'Engineering',
      status: 'REMOTE',
      checkInTime: '09:30 AM',
    },
  ];

  const filteredMembers = teamList.filter((m) => {
    if (activeZone !== 'ALL' && m.zone !== activeZone) return false;
    return true;
  });

  const getStatusColor = (status: DeskMember['status']) => {
    switch (status) {
      case 'DESK':
        return {
          bg: '#10b981',
          chipBg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
          chipColor: isDark ? '#34d399' : '#047857',
          border: isDark ? 'rgba(16, 185, 129, 0.35)' : '#a7f3d0',
          label: 'At Desk',
          icon: <ChairRoundedIcon sx={{ fontSize: 13 }} />,
        };
      case 'MEETING':
        return {
          bg: '#8b5cf6',
          chipBg: isDark ? 'rgba(139, 92, 246, 0.18)' : '#f5f3ff',
          chipColor: isDark ? '#a78bfa' : '#6d28d9',
          border: isDark ? 'rgba(139, 92, 246, 0.35)' : '#ddd6fe',
          label: 'In Meeting',
          icon: <MeetingRoomRoundedIcon sx={{ fontSize: 13 }} />,
        };
      case 'COFFEE':
        return {
          bg: '#f59e0b',
          chipBg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb',
          chipColor: isDark ? '#fbbf24' : '#b45309',
          border: isDark ? 'rgba(245, 158, 11, 0.35)' : '#fde68a',
          label: 'Coffee / Break',
          icon: <LocalCafeRoundedIcon sx={{ fontSize: 13 }} />,
        };
      case 'REMOTE':
        return {
          bg: '#0284c7',
          chipBg: isDark ? 'rgba(2, 132, 199, 0.18)' : '#f0f9ff',
          chipColor: isDark ? '#38bdf8' : '#0369a1',
          border: isDark ? 'rgba(2, 132, 199, 0.35)' : '#bae6fd',
          label: 'Remote / WFH',
          icon: <LaptopMacRoundedIcon sx={{ fontSize: 13 }} />,
        };
    }
  };

  const handlePing = () => {
    if (!selectedMember) return;
    hapticSuccess();
    toastSuccess(`Ping sent to ${selectedMember.name}! "Catch up for 5 mins / coffee ☕"`);
    setSelectedMember(null);
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
      }}
    >
      {/* Header & Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 17 }, letterSpacing: '-0.02em' }}>
            Live Office Floor Plan &amp; Presence Map
          </Typography>
          <Typography sx={{ fontSize: { xs: 11, sm: 12 }, color: 'text.secondary', mt: 0.25 }}>
            Interactive seating chart: See who is in HQ, at desks, in meetings, or taking a break
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
          {['ALL', 'Engineering', 'Product', 'Executive'].map((zone) => (
            <Chip
              key={zone}
              label={zone}
              size="small"
              onClick={() => {
                hapticTap();
                setActiveZone(zone);
              }}
              sx={{
                fontWeight: 800,
                fontSize: 11,
                borderRadius: '8px',
                cursor: 'pointer',
                bgcolor: activeZone === zone ? (isDark ? '#38bdf8' : '#0f172a') : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                color: activeZone === zone ? '#ffffff' : 'text.secondary',
                '&:hover': {
                  bgcolor: activeZone === zone ? (isDark ? '#0284c7' : '#1e293b') : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                },
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Visual Floor Plan Canvas Grid */}
      <Box
        sx={{
          borderRadius: '16px',
          p: { xs: 1.25, sm: 2 },
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(241, 245, 249, 0.5)',
          border: '1px dashed',
          borderColor: 'divider',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 1.5,
          mb: 2,
        }}
      >
        {filteredMembers.map((member) => {
          const statusObj = getStatusColor(member.status);

          return (
            <Box
              key={member.id}
              component={motion.div}
              whileHover={{ y: -3, scale: 1.02 }}
              onClick={() => {
                hapticTap();
                setSelectedMember(member);
              }}
              sx={{
                p: 1.75,
                borderRadius: '16px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 14px rgba(15,23,42,0.06)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.25,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  borderColor: statusObj.bg,
                },
              }}
            >
              {/* Left Color Accent Bar */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 5,
                  bgcolor: statusObj.bg,
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 0.5, minWidth: 0 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      fontWeight: 900,
                      background: member.gradient,
                      color: '#ffffff !important',
                      fontSize: 14,
                      letterSpacing: '0.5px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.16)',
                      border: '2px solid rgba(255, 255, 255, 0.85)',
                    }}
                  >
                    {member.initials}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -1,
                      right: -1,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: statusObj.bg,
                      border: '2px solid',
                      borderColor: 'background.paper',
                      boxShadow: `0 0 8px ${statusObj.bg}`,
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: { xs: 13, sm: 14 }, color: 'text.primary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.role} · Desk {member.deskId}
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={statusObj.icon}
                label={statusObj.label}
                size="small"
                sx={{
                  fontWeight: 800,
                  fontSize: 10.5,
                  height: 24,
                  bgcolor: statusObj.chipBg,
                  color: statusObj.chipColor,
                  border: `1px solid ${statusObj.border}`,
                  '& .MuiChip-icon': { color: `${statusObj.chipColor} !important` },
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
          Click any teammate card to view desk location or send a quick coffee / sync ping.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            ['At Desk', '#10b981'],
            ['In Meeting', '#8b5cf6'],
            ['Coffee / Break', '#f59e0b'],
            ['Remote', '#0284c7'],
          ].map(([lbl, clr]) => (
            <Box key={lbl} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: clr }} />
              <Typography sx={{ fontSize: 10.5, color: 'text.secondary', fontWeight: 700 }}>{lbl}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Member Details & Quick Ping Modal */}
      <Dialog
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Desk Presence Info
          <IconButton size="small" onClick={() => setSelectedMember(null)}>
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {selectedMember && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    background: selectedMember.gradient,
                    color: '#ffffff !important',
                    fontWeight: 900,
                    fontSize: 18,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                >
                  {selectedMember.initials}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{selectedMember.name}</Typography>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{selectedMember.role}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>{selectedMember.zone} Wing · Desk {selectedMember.deskId}</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', border: '1px solid', borderColor: 'divider' }}>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Today Clock-In Time:</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#10b981', mt: 0.25 }}>
                  {selectedMember.checkInTime} (Onsite Verified)
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSelectedMember(null)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<SendRoundedIcon />}
            onClick={handlePing}
            sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}
          >
            Ping for Coffee / Sync ☕
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
