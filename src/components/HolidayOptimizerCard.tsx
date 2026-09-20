import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { Holiday } from '../types';
import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

interface HolidayOptimizerCardProps {
  holidays: Holiday[];
  onApplyLeave?: (fromDate: string, toDate: string, reason: string) => void;
}

export interface Opportunity {
  holidayName: string;
  holidayDate: string;
  suggestedLeaveDate: string;
  suggestedLeaveDisplay: string;
  totalDaysOff: number;
  datesRange: string;
  description?: string;
}

export function HolidayOptimizerCard({ holidays, onApplyLeave }: HolidayOptimizerCardProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Analyze holidays within the next 90 days for bridge opportunities
  const opportunities = useMemo<Opportunity[]>(() => {
    const today = dayjs();
    const list: Opportunity[] = [];

    // Filter upcoming holidays within next 3 months
    const upcoming = holidays
      .map((h) => ({ ...h, d: dayjs(h.date) }))
      .filter((h) => h.d.isAfter(today) && h.d.diff(today, 'day') <= 120)
      .sort((a, b) => a.d.valueOf() - b.d.valueOf());

    for (const h of upcoming) {
      const dayOfWeek = h.d.day(); // 0 is Sunday, 1 is Monday ... 4 is Thursday, 5 is Friday

      // Thursday holiday -> Bridge on Friday = 4-day weekend (Thu, Fri, Sat, Sun)
      if (dayOfWeek === 4) {
        const bridgeDate = h.d.add(1, 'day');
        list.push({
          holidayName: h.name,
          holidayDate: h.d.format('MMM D (Thu)'),
          suggestedLeaveDate: bridgeDate.format('YYYY-MM-DD'),
          suggestedLeaveDisplay: bridgeDate.format('MMM D (Fri)'),
          totalDaysOff: 4,
          datesRange: `${h.d.format('MMM D')} – ${h.d.add(3, 'day').format('MMM D')}`,
          description: `Holiday on Thursday + 1 day PTO on Friday = 4 days of vacation!`,
        });
      }
      // Tuesday holiday -> Bridge on Monday = 4-day weekend (Sat, Sun, Mon, Tue)
      else if (dayOfWeek === 2) {
        const bridgeDate = h.d.subtract(1, 'day');
        list.push({
          holidayName: h.name,
          holidayDate: h.d.format('MMM D (Tue)'),
          suggestedLeaveDate: bridgeDate.format('YYYY-MM-DD'),
          suggestedLeaveDisplay: bridgeDate.format('MMM D (Mon)'),
          totalDaysOff: 4,
          datesRange: `${h.d.subtract(3, 'day').format('MMM D')} – ${h.d.format('MMM D')}`,
          description: `Holiday on Tuesday + 1 day PTO on Monday = 4 days of vacation!`,
        });
      }
      // Friday holiday -> Natural 3-day long weekend
      else if (dayOfWeek === 5) {
        list.push({
          holidayName: h.name,
          holidayDate: h.d.format('MMM D (Fri)'),
          suggestedLeaveDate: h.d.subtract(1, 'day').format('YYYY-MM-DD'),
          suggestedLeaveDisplay: h.d.subtract(1, 'day').format('MMM D (Thu)'),
          totalDaysOff: 4,
          datesRange: `${h.d.subtract(1, 'day').format('MMM D')} – ${h.d.add(2, 'day').format('MMM D')}`,
          description: `3-day weekend! Add Thursday to turn it into an easy 4-day getaway.`,
        });
      }
    }

    // Default fallback demo recommendation if company has no immediate Thursday/Tuesday holidays
    if (list.length === 0) {
      list.push({
        holidayName: 'Upcoming Seasonal Break',
        holidayDate: today.add(18, 'day').format('MMM D (Thu)'),
        suggestedLeaveDate: today.add(19, 'day').format('YYYY-MM-DD'),
        suggestedLeaveDisplay: today.add(19, 'day').format('MMM D (Fri)'),
        totalDaysOff: 4,
        datesRange: `${today.add(18, 'day').format('MMM D')} – ${today.add(21, 'day').format('MMM D')}`,
        description: `Holiday on Thursday + 1 day PTO on Friday = 4-day weekend!`,
      });
    }

    return list.slice(0, 2);
  }, [holidays]);

  const handleApplyClick = (opp: (typeof opportunities)[0]) => {
    hapticTap();
    setSelectedOpportunity(opp);
    setConfirmModalOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedOpportunity) return;
    hapticSuccess();
    onApplyLeave?.(
      selectedOpportunity.suggestedLeaveDate,
      selectedOpportunity.suggestedLeaveDate,
      `Bridge Leave for ${selectedOpportunity.holidayName} (Long Weekend)`
    );
    toastSuccess(
      `Pre-filled leave application for ${selectedOpportunity.suggestedLeaveDisplay}! Redirecting to Requests tab...`
    );
    setConfirmModalOpen(false);
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
            <FlightTakeoffRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 16 }}>
              Smart AI Bridge Leave & Vacation Optimizer
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>
              Maximize your time off: Take 1 day PTO to get 4 consecutive days of vacation
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<AutoAwesomeRoundedIcon sx={{ fontSize: '14px !important', color: '#ec4899 !important' }} />}
          label="AI Suggested"
          size="small"
          sx={{
            fontWeight: 800,
            fontSize: 11,
            bgcolor: isDark ? 'rgba(236, 72, 153, 0.15)' : 'rgba(236, 72, 153, 0.1)',
            color: '#ec4899',
            border: `1px solid ${isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.2)'}`,
          }}
        />
      </Box>

      {/* Opportunities List */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        {opportunities.map((opp) => (
          <Box
            key={opp.holidayDate + opp.holidayName}
            component={motion.div}
            whileHover={{ y: -2 }}
            sx={{
              p: 2,
              borderRadius: '16px',
              background: isDark
                ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)'
                : 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)',
              border: `1px solid ${isDark ? 'rgba(236, 72, 153, 0.25)' : 'rgba(236, 72, 153, 0.2)'}`,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: 15, color: '#ec4899' }}>
                  🌴 {opp.totalDaysOff}-Day Long Weekend Opportunity
                </Typography>
                <Chip
                  label={opp.datesRange}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: 11, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                />
              </Box>

              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                {opp.holidayName} · {opp.holidayDate}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4 }}>
                {opp.description}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Box>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                  Suggested PTO Date:
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 900, color: '#ec4899' }}>
                  {opp.suggestedLeaveDisplay}
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => handleApplyClick(opp)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: 12,
                  bgcolor: '#ec4899',
                  '&:hover': { bgcolor: '#db2777' },
                  textTransform: 'none',
                }}
              >
                Apply Bridge Day
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Pre-fill Bridge Leave Application?</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {selectedOpportunity && (
            <>
              <Typography sx={{ fontSize: 14 }}>
                You are about to apply for <strong>1 Day Leave</strong> on{' '}
                <span style={{ color: '#ec4899', fontWeight: 800 }}>
                  {selectedOpportunity.suggestedLeaveDisplay}
                </span>{' '}
                to enjoy <strong>4 consecutive days off</strong> ({selectedOpportunity.datesRange}).
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Reason pre-fill:</Typography>
                <Typography sx={{ fontSize: 13, fontWeight: 700, mt: 0.25 }}>
                  Bridge Leave for {selectedOpportunity.holidayName} (Extended Long Weekend)
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmModalOpen(false)} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            sx={{ borderRadius: '10px', fontWeight: 800, bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' }, textTransform: 'none' }}
          >
            Confirm & Pre-fill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
