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
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import AddReactionRoundedIcon from '@mui/icons-material/AddReactionRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

interface KudosItem {
  id: string;
  sender: string;
  recipient: string;
  badge: string;
  icon: string;
  color: string;
  message: string;
  timeAgo: string;
  likes: number;
}

const INITIAL_KUDOS: KudosItem[] = [
  {
    id: '1',
    sender: 'Priya Sharma',
    recipient: 'Venkata Rao',
    badge: 'Shift Savior',
    icon: '🤝',
    color: '#38bdf8',
    message: 'Huge thanks for stepping in and covering the afternoon shift on Tuesday!',
    timeAgo: '2h ago',
    likes: 6,
  },
  {
    id: '2',
    sender: 'Rahul Verma',
    recipient: 'Anita Patel',
    badge: 'Punctuality Pro',
    icon: '⚡',
    color: '#f59e0b',
    message: 'Always on time for morning standups without fail. Inspiring consistency!',
    timeAgo: 'Yesterday',
    likes: 4,
  },
  {
    id: '3',
    sender: 'Vikram Singh',
    recipient: 'Kavita Reddy',
    badge: 'Team Pillar',
    icon: '🌟',
    color: '#ec4899',
    message: 'Crushed the sprint release and helped everyone balance their shift schedules.',
    timeAgo: '2 days ago',
    likes: 9,
  },
];

export function PeerKudosWall() {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [kudosList, setKudosList] = useState<KudosItem[]>(INITIAL_KUDOS);
  const [giveModalOpen, setGiveModalOpen] = useState(false);
  const [recipient, setRecipient] = useState('Priya Sharma');
  const [badgeCategory, setBadgeCategory] = useState<'Shift Savior' | 'Punctuality Pro' | 'Team Pillar' | 'Problem Solver'>('Shift Savior');
  const [message, setMessage] = useState('');

  const handleLike = (id: string) => {
    hapticPop();
    setKudosList((prev) =>
      prev.map((k) => (k.id === id ? { ...k, likes: k.likes + 1 } : k))
    );
  };

  const handleSendKudos = () => {
    if (!message.trim()) return;
    hapticSuccess();
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {
      // Ignore if canvas not available
    }

    const badgeConfig = {
      'Shift Savior': { icon: '🤝', color: '#38bdf8' },
      'Punctuality Pro': { icon: '⚡', color: '#f59e0b' },
      'Team Pillar': { icon: '🌟', color: '#ec4899' },
      'Problem Solver': { icon: '💡', color: '#10b981' },
    }[badgeCategory];

    const newKudos: KudosItem = {
      id: Date.now().toString(),
      sender: 'You',
      recipient,
      badge: badgeCategory,
      icon: badgeConfig.icon,
      color: badgeConfig.color,
      message: message.trim(),
      timeAgo: 'Just now',
      likes: 1,
    };

    setKudosList((prev) => [newKudos, ...prev]);
    toastSuccess(`Kudos sent to ${recipient}! 🌟`);
    setMessage('');
    setGiveModalOpen(false);
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
              color: '#ec4899',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <VolunteerActivismRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
              Team Recognition & Shift Kudos Wall
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
              Celebrate colleagues for great attendance and shift coverage
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="contained"
          onClick={() => {
            hapticTap();
            setGiveModalOpen(true);
          }}
          startIcon={<AddReactionRoundedIcon fontSize="small" />}
          sx={{
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 12,
            bgcolor: '#ec4899',
            '&:hover': { bgcolor: '#db2777' },
          }}
        >
          Give Kudos
        </Button>
      </Box>

      {/* Monthly Champion Spotlight Banner */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.75,
          borderRadius: '14px',
          bgcolor: isDark ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.05)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.15)',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <EmojiEventsRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#f59e0b' }}>
              🌟 September Punctuality Champion: Venkata Rao
            </Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
              Awarded 14 peer kudos & 100% on-time arrival record this month!
            </Typography>
          </Box>
        </Box>
        <Chip
          size="small"
          label="Top Contributor"
          sx={{ fontWeight: 800, fontSize: 10, bgcolor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
        />
      </Box>

      {/* Kudos Feed */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {kudosList.map((k) => (
          <Box
            key={k.id}
            sx={{
              p: 1.75,
              borderRadius: '14px',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', gap: 1.25 }}>
              <Avatar sx={{ width: 34, height: 34, fontSize: 13, bgcolor: k.color, fontWeight: 800 }}>
                {k.recipient[0]}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 900 }}>
                    {k.sender} ➔ {k.recipient}
                  </Typography>
                  <Chip
                    size="small"
                    label={`${k.icon} ${k.badge}`}
                    sx={{
                      height: 20,
                      fontSize: 10,
                      fontWeight: 800,
                      bgcolor: `${k.color}18`,
                      color: k.color,
                      border: `1px solid ${k.color}33`,
                    }}
                  />
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>· {k.timeAgo}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: 'text.primary', mt: 0.5, lineHeight: 1.4 }}>
                  "{k.message}"
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              onClick={() => handleLike(k.id)}
              startIcon={<FavoriteRoundedIcon sx={{ fontSize: '14px !important', color: '#ec4899' }} />}
              sx={{
                borderRadius: '8px',
                fontSize: 11,
                fontWeight: 800,
                color: 'text.secondary',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                minWidth: 50,
                py: 0.25,
              }}
            >
              {k.likes}
            </Button>
          </Box>
        ))}
      </Box>

      {/* Give Kudos Modal */}
      <Dialog
        open={giveModalOpen}
        onClose={() => setGiveModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, fontSize: 17, display: 'flex', alignItems: 'center', gap: 1 }}>
          <VolunteerActivismRoundedIcon sx={{ color: '#ec4899' }} /> Send Peer Kudos
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            select
            label="Recipient Colleague"
            size="small"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            fullWidth
          >
            <MenuItem value="Priya Sharma">Priya Sharma (Staff PM)</MenuItem>
            <MenuItem value="Rahul Verma">Rahul Verma (Frontend Dev)</MenuItem>
            <MenuItem value="Anita Patel">Anita Patel (Principal Designer)</MenuItem>
            <MenuItem value="Kavita Reddy">Kavita Reddy (Backend Dev)</MenuItem>
            <MenuItem value="Vikram Singh">Vikram Singh (HR Director)</MenuItem>
          </TextField>

          <TextField
            select
            label="Recognition Badge"
            size="small"
            value={badgeCategory}
            onChange={(e) => setBadgeCategory(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="Shift Savior">🤝 Shift Savior (Coverage)</MenuItem>
            <MenuItem value="Punctuality Pro">⚡ Punctuality Pro (Reliability)</MenuItem>
            <MenuItem value="Team Pillar">🌟 Team Pillar (Support)</MenuItem>
            <MenuItem value="Problem Solver">💡 Problem Solver (Excellence)</MenuItem>
          </TextField>

          <TextField
            label="Your Message"
            size="small"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Thanks so much for stepping up and helping with the shift handoff!"
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setGiveModalOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendKudos}
            disabled={!message.trim()}
            sx={{
              fontWeight: 900,
              borderRadius: '12px',
              bgcolor: '#ec4899',
              '&:hover': { bgcolor: '#db2777' },
            }}
          >
            Send Kudos 🌟
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
