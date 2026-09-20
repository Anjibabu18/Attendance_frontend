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
  const [submittedNotes, setSubmittedNotes] = useState<Array<{ id: string; summary: string; mood: string; timestamp: string }>>([
    {
      id: '1',
      summary: 'Completed architectural code review for attendance sync engine & closed 4 tickets.',
      mood: '🚀 Productive',
      timestamp: 'Yesterday · 06:15 PM',
    },
  ]);

  const handleAiDraft = () => {
    hapticTap();
    setDrafting(true);
    setTimeout(() => {
      setAccomplishments(
        '• Completed scheduled on-site shift duties with 100% punctuality.\n• Closed pending tickets and updated sprint tracker.\n• Verified hardware punch integrity and team status board.'
      );
      setHandoverNotes(
        '• Night shift support coverage handed over to Priya Sharma.\n• System health green, no blocking issues.'
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
      summary: accomplishments.trim(),
      mood,
      timestamp: 'Just now',
    };
    setSubmittedNotes((prev) => [newEntry, ...prev]);
    toastSuccess('Daily shift handover note logged for your manager!');
    setAccomplishments('');
    setHandoverNotes('');
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
              bgcolor: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)',
              color: '#a855f7',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <HistoryEduRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16, lineHeight: 1.2 }}>
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
            fontSize: 11,
            borderColor: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
            color: 'text.primary',
            '&:hover': {
              borderColor: '#a855f7',
              bgcolor: isDark ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)',
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
          placeholder="e.g. Handed over deployment monitor to Priya; customer ticket #412 requires follow-up..."
          size="small"
          value={handoverNotes}
          onChange={(e) => setHandoverNotes(e.target.value)}
          fullWidth
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', fontSize: 13 } }}
        />

        {/* Shift Mood Selector & Submit */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  color: mood === m ? '#a855f7' : 'text.secondary',
                  border: mood === m ? '1px solid #a855f7' : '1px solid transparent',
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
              bgcolor: '#a855f7',
              '&:hover': { bgcolor: '#9333ea' },
            }}
          >
            Save Handover Log
          </Button>
        </Box>
      </Box>

      {/* Recent Notes Preview */}
      {submittedNotes.length > 0 && (
        <Box sx={{ pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Recent Handover History
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {submittedNotes.map((note) => (
              <Box
                key={note.id}
                sx={{
                  p: 1.25,
                  borderRadius: '10px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#a855f7' }}>{note.mood}</Typography>
                  <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>{note.timestamp}</Typography>
                </Box>
                <Typography sx={{ fontSize: 12, whiteSpace: 'pre-line' }}>{note.summary}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
