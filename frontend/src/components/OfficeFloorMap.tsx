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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import LocalCafeRoundedIcon from '@mui/icons-material/LocalCafeRounded';
import LaptopMacRoundedIcon from '@mui/icons-material/LaptopMacRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ChairRoundedIcon from '@mui/icons-material/ChairRounded';
import { motion } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

interface DeskMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<DeskMember | null>(null);

  const teamList: DeskMember[] = [
    {
      id: 'me',
      name: currentEmployee?.name || 'You (Staff Specialist)',
      role: currentEmployee?.companyRole?.name || 'Staff Specialist',
      deskId: 'E-01',
      zone: 'Engineering',
      status: isPunchedIn ? 'DESK' : 'REMOTE',
      checkInTime: isPunchedIn ? 'Active Now' : 'Not Clocked In',
    },
    { id: '2', name: 'Priya Sharma', role: 'Staff Product Manager', deskId: 'P-04', zone: 'Product', status: 'MEETING', checkInTime: '09:28 AM' },
    { id: '3', name: 'Rahul Verma', role: 'Senior Frontend Dev', deskId: 'E-02', zone: 'Engineering', status: 'COFFEE', checkInTime: '09:40 AM' },
    { id: '4', name: 'Anita Patel', role: 'Principal Designer', deskId: 'P-01', zone: 'Product', status: 'DESK', checkInTime: '09:10 AM' },
    { id: '5', name: 'Vikram Singh', role: 'HR Director', deskId: 'X-01', zone: 'Executive', status: 'DESK', checkInTime: '09:05 AM' },
    { id: '6', name: 'Kavita Reddy', role: 'Backend Engineer', deskId: 'E-03', zone: 'Engineering', status: 'REMOTE', checkInTime: '09:30 AM' },
  ];

  const filteredMembers = teamList.filter((m) => {
    if (activeZone !== 'ALL' && m.zone !== activeZone) return false;
    if (searchQuery.trim()) {
      return (
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.deskId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const getStatusColor = (status: DeskMember['status']) => {
    switch (status) {
      case 'DESK':
        return { bg: '#10b981', label: 'At Desk', icon: <ChairRoundedIcon sx={{ fontSize: 13 }} /> };
      case 'MEETING':
        return { bg: '#8b5cf6', label: 'In Meeting', icon: <MeetingRoomRoundedIcon sx={{ fontSize: 13 }} /> };
      case 'COFFEE':
        return { bg: '#f59e0b', label: 'Coffee / Break', icon: <LocalCafeRoundedIcon sx={{ fontSize: 13 }} /> };
      case 'REMOTE':
        return { bg: '#38bdf8', label: 'Remote / WFH', icon: <LaptopMacRoundedIcon sx={{ fontSize: 13 }} /> };
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
        p: 2.5,
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.3)' : '0 12px 32px rgba(15, 23, 42, 0.05)',
      }}
    >
      {/* Header & Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
            Live Office Floor Plan &amp; Presence Map
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
            Interactive seating chart: See who is in HQ, at desks, in meetings, or taking a break
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {['ALL', 'Engineering', 'Product', 'Executive'].map((zone) => (
            <Chip
              key={zone}
              label={zone}
              size="small"
              onClick={() => {
                hapticTap();
                setActiveZone(zone);
              }}
              color={activeZone === zone ? 'primary' : 'default'}
              sx={{ fontWeight: 800, fontSize: 11, borderRadius: '8px', cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>

      {/* Visual Floor Plan Canvas Grid */}
      <Box
        sx={{
          borderRadius: '16px',
          p: 2,
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.02)',
          border: '1px dashed',
          borderColor: 'divider',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
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
                p: 1.5,
                borderRadius: '14px',
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.2)' : '0 4px 14px rgba(15,23,42,0.04)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.25,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Left Color Accent Bar */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  bgcolor: statusObj.bg,
                }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pl: 0.5, minWidth: 0 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar sx={{ width: 38, height: 38, fontWeight: 900, bgcolor: 'primary.main', fontSize: 14 }}>
                    {member.name.charAt(0)}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: statusObj.bg,
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  />
                </Box>

                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.name}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {member.role} · Desk {member.deskId}
                  </Typography>
                </Box>
              </Box>

              <Chip
                icon={statusObj.icon}
                label={statusObj.label}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  fontWeight: 800,
                  bgcolor: `${statusObj.bg}20`,
                  color: statusObj.bg,
                  border: `1px solid ${statusObj.bg}40`,
                  flexShrink: 0,
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
          Click any teammate card to view desk location or send a quick coffee / sync ping.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {[
            ['At Desk', '#10b981'],
            ['In Meeting', '#8b5cf6'],
            ['Coffee / Break', '#f59e0b'],
            ['Remote', '#38bdf8'],
          ].map(([lbl, clr]) => (
            <Box key={lbl} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: clr }} />
              <Typography sx={{ fontSize: 10, color: 'text.secondary', fontWeight: 700 }}>{lbl}</Typography>
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
                <Avatar sx={{ width: 50, height: 50, bgcolor: 'primary.main', fontWeight: 900, fontSize: 18 }}>
                  {selectedMember.name.charAt(0)}
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
