import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import HistoryEduRoundedIcon from '@mui/icons-material/HistoryEduRounded';
import MoodRoundedIcon from '@mui/icons-material/MoodRounded';
import { motion } from 'framer-motion';

import dayjs from 'dayjs';

import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

export function ShiftHandoverNotesCard() {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [accomplishments, setAccomplishments] = useState('');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [mood, setMood] = useState<'🚀 Productive' | '⚡ Fast-Paced' | '☕ Smooth'>('🚀 Productive');
  const [drafting, setDrafting] = useState(false);
  const [submittedNotes, setSubmittedNotes] = useState<Array<{ id: string; summary: string; mood: string; timestamp: string }>>(() => {
    try {
      const raw = localStorage.getItem('worktrack_shift_handovers_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  const handleAiDraft = () => {
    hapticTap();
    setDrafting(true);
    setTimeout(() => {
      setAccomplishments(
        '• Completed scheduled on-site shift duties with 100% punctuality.\n• Closed pending tickets and updated sprint tracker.\n• Verified hardware punch integrity and team status board.'
      );
      setHandoverNotes(
        '• Shift duties and tasks handed over to next shift colleague.\n• System health green, no blocking issues.'
      );
      setDrafting(false);
      hapticSuccess();
      toastSuccess('AI summarized your shift log into bullet points!');
    }, 900);
  };

  const handleSubmit = () => {
    if (!accomplishments.trim()) return;
    hapticSuccess();
    const newEntry = {
      id: Date.now().toString(),
      summary: accomplishments.trim() + (handoverNotes.trim() ? `\n• Handover: ${handoverNotes.trim()}` : ''),
      mood,
      timestamp: `${dayjs().format('hh:mm A')} · Today`,
    };
    const updated = [newEntry, ...submittedNotes];
    setSubmittedNotes(updated);
    try {
      localStorage.setItem('worktrack_shift_handovers_v1', JSON.stringify(updated));
    } catch {}
    toastSuccess('Daily shift handover note logged for your manager!');
    setAccomplishments('');
    setHandoverNotes('');
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
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 2,
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(168, 85, 247, 0.18)' : 'rgba(168, 85, 247, 0.1)',
              color: '#a855f7',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <HistoryEduRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 16 }, lineHeight: 1.2 }}>
              Daily Shift Handover & Accomplishments
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', fontWeight: 600 }}>
              Log what you accomplished before punching out
            </Typography>
          </Box>
        </Box>

        <Button
          size="small"
          variant="outlined"
          onClick={handleAiDraft}
          disabled={drafting}
          startIcon={<AutoAwesomeRoundedIcon fontSize="small" sx={{ color: '#a855f7' }} />}
          sx={{
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 12,
            width: { xs: '100%', sm: 'auto' },
            borderColor: isDark ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.25)',
            color: isDark ? '#d8b4fe' : '#7e22ce',
            bgcolor: isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.04)',
            '&:hover': {
              borderColor: '#a855f7',
              bgcolor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.08)',
            },
          }}
        >
          {drafting ? 'Drafting...' : 'AI Auto-Draft'}
        </Button>
      </Box>

      {/* Inputs */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
        <TextField
          label="Today's Accomplishments"
          placeholder="e.g. Deployed API hotfix, reviewed 3 PRs, attended product sprint demo..."
          multiline
          rows={2}
          size="small"
          value={accomplishments}
          onChange={(e) => setAccomplishments(e.target.value)}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: 13 } }}
        />

        <TextField
          label="Handover / Next Shift Notes (Optional)"
          placeholder="e.g. Handed over deployment monitor to next lead; customer ticket #412 requires follow-up..."
          size="small"
          value={handoverNotes}
          onChange={(e) => setHandoverNotes(e.target.value)}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: 13 } }}
        />

        {/* Shift Mood Selector & Submit */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>Shift Mood:</Typography>
            {(['🚀 Productive', '⚡ Fast-Paced', '☕ Smooth'] as const).map((m) => (
              <Chip
                key={m}
                size="small"
                label={m}
                onClick={() => setMood(m)}
                sx={{
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                  bgcolor: mood === m ? (isDark ? 'rgba(168, 85, 247, 0.25)' : '#f3e8ff') : 'action.hover',
                  color: mood === m ? (isDark ? '#e9d5ff' : '#7e22ce') : 'text.secondary',
                  border: mood === m ? '1px solid #a855f7' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(168, 85, 247, 0.3)' : '#ebd5ff',
                  },
                }}
              />
            ))}
          </Box>

          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={!accomplishments.trim()}
            startIcon={<SendRoundedIcon fontSize="small" />}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 800,
              fontSize: 12,
              px: 2,
              py: { xs: 1, sm: 0.75 },
              width: { xs: '100%', sm: 'auto' },
              bgcolor: '#a855f7',
              '&:hover': { bgcolor: '#9333ea' },
            }}
          >
            Save Handover Log
          </Button>
        </Box>
      </Box>

      {/* Recent Notes Preview */}
      <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Handover History
          </Typography>
          <Chip
            size="small"
            label={`${submittedNotes.length} logged`}
            sx={{ fontSize: 10, fontWeight: 700, height: 20, bgcolor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.08)', color: '#a855f7' }}
          />
        </Box>
        {submittedNotes.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {submittedNotes.map((note) => (
              <Box
                key={note.id}
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: isDark ? '#c084fc' : '#9333ea' }}>{note.mood}</Typography>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>{note.timestamp}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12.5, whiteSpace: 'pre-line', color: 'text.primary', lineHeight: 1.5 }}>
                  {note.summary}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 12, color: 'text.secondary', fontStyle: 'italic', py: 1 }}>
            No handovers logged yet. Notes saved here or during evening checkout will appear in this log.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
