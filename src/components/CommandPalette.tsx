import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import LoginRoundedIcon from '@mui/icons-material/LoginRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import FreeBreakfastRoundedIcon from '@mui/icons-material/FreeBreakfastRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import FlashOnRoundedIcon from '@mui/icons-material/FlashOnRounded';
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import TabletRoundedIcon from '@mui/icons-material/TabletRounded';
import ChairRoundedIcon from '@mui/icons-material/ChairRounded';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import VolunteerActivismRoundedIcon from '@mui/icons-material/VolunteerActivismRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import { motion, AnimatePresence } from 'framer-motion';

import { useThemeContext } from '../theme/ThemeContext';
import { hapticPop, hapticSuccess, hapticTap } from '../utils/haptics';

export interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Preferences & Tools';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigateTab?: (tabIndex: number) => void;
  onTriggerPunch?: (type: 'in' | 'out') => void;
  onTriggerBreak?: () => void;
  onQuickLeave?: () => void;
  onCopyReport?: () => void;
  onRefresh?: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavigateTab,
  onTriggerPunch,
  onTriggerBreak,
  onQuickLeave,
  onCopyReport,
  onRefresh,
}: CommandPaletteProps) {
  const { mode, toggleColorMode } = useThemeContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDark = mode === 'dark';

  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: 'nav-dashboard',
        category: 'Navigation',
        title: 'Go to Dashboard',
        subtitle: 'Today overview, shift timer & punch controls',
        icon: <DashboardRoundedIcon fontSize="small" sx={{ color: '#38bdf8' }} />,
        shortcut: 'G D',
        action: () => {
          onNavigateTab?.(0);
          onClose();
        },
      },
      {
        id: 'nav-attendance',
        category: 'Navigation',
        title: 'Go to Attendance & History',
        subtitle: 'Monthly log, heatmap, punch audit & leaves',
        icon: <CalendarMonthRoundedIcon fontSize="small" sx={{ color: '#818cf8' }} />,
        shortcut: 'G A',
        action: () => {
          onNavigateTab?.(1);
          onClose();
        },
      },
      {
        id: 'nav-requests',
        category: 'Navigation',
        title: 'Go to Requests & Corrections',
        subtitle: 'Apply leave, WFH, on-duty & regularize attendance',
        icon: <FactCheckRoundedIcon fontSize="small" sx={{ color: '#ec4899' }} />,
        shortcut: 'G R',
        action: () => {
          onNavigateTab?.(2);
          onClose();
        },
      },
      {
        id: 'nav-more',
        category: 'Navigation',
        title: 'Go to Profile & Settings',
        subtitle: 'Company policies, devices, reports & account info',
        icon: <TuneRoundedIcon fontSize="small" sx={{ color: '#10b981' }} />,
        shortcut: 'G P',
        action: () => {
          onNavigateTab?.(3);
          onClose();
        },
      },
      {
        id: 'nav-floor-plan',
        category: 'Navigation',
        title: 'Office Floor Map & Seating',
        subtitle: 'Find where colleagues sit and ping them for coffee or sync',
        icon: <ChairRoundedIcon fontSize="small" sx={{ color: '#10b981' }} />,
        shortcut: 'G F',
        action: () => {
          onNavigateTab?.(0);
          onClose();
        },
      },
      {
        id: 'nav-badges',
        category: 'Navigation',
        title: 'Attendance Badges & Division League',
        subtitle: 'View your punctuality streak, tier rank & achievements',
        icon: <EmojiEventsRoundedIcon fontSize="small" sx={{ color: '#f59e0b' }} />,
        shortcut: 'G B',
        action: () => {
          onNavigateTab?.(0);
          onClose();
        },
      },
      {
        id: 'nav-holiday-optimizer',
        category: 'Navigation',
        title: 'AI Holiday & Long Weekend Optimizer',
        subtitle: 'Discover bridge days to turn 1 leave day into 4-day holidays',
        icon: <BeachAccessRoundedIcon fontSize="small" sx={{ color: '#06b6d4' }} />,
        shortcut: 'G H',
        action: () => {
          onNavigateTab?.(1);
          onClose();
        },
      },
      {
        id: 'nav-commute',
        category: 'Navigation',
        title: 'Smart Commute & Departure Assistant',
        subtitle: 'Live transit time to HQ, traffic density & weather updates',
        icon: <NavigationRoundedIcon fontSize="small" sx={{ color: '#0284c7' }} />,
        shortcut: 'G C',
        action: () => {
          onNavigateTab?.(0);
          onClose();
        },
      },
      {
        id: 'nav-anomaly',
        category: 'Navigation',
        title: 'AI Anomaly & Fraud Prevention Shield',
        subtitle: 'Cryptographic GPS verification, trust score & velocity check',
        icon: <VerifiedUserRoundedIcon fontSize="small" sx={{ color: '#10b981' }} />,
        shortcut: 'G V',
        action: () => {
          onNavigateTab?.(1);
          onClose();
        },
      },
      {
        id: 'nav-presence',
        category: 'Navigation',
        title: 'Slack & Teams Auto-Presence Sync',
        subtitle: 'Sync your physical badge punch to corporate chat channels',
        icon: <ChatBubbleOutlineRoundedIcon fontSize="small" sx={{ color: '#6366f1' }} />,
        shortcut: 'G S',
        action: () => {
          onNavigateTab?.(0);
          onClose();
        },
      },
      {
        id: 'nav-kudos',
        category: 'Navigation',
        title: 'Team Recognition & Shift Kudos Wall',
        subtitle: 'Celebrate shift coverage and view monthly punctuality champions',
        icon: <VolunteerActivismRoundedIcon fontSize="small" sx={{ color: '#ec4899' }} />,
        shortcut: 'G K',
        action: () => {
          onNavigateTab?.(0);
          onClose();
        },
      },
      // Quick Actions
      {
        id: 'act-punch-in',
        category: 'Actions',
        title: 'Punch In / Check In',
        subtitle: 'Record morning arrival with GPS & camera verification',
        icon: <LoginRoundedIcon fontSize="small" sx={{ color: '#22c55e' }} />,
        shortcut: 'P I',
        action: () => {
          onClose();
          onTriggerPunch?.('in');
        },
      },
      {
        id: 'act-punch-out',
        category: 'Actions',
        title: 'Punch Out / Check Out',
        subtitle: 'End today shift and save total hours worked',
        icon: <LogoutRoundedIcon fontSize="small" sx={{ color: '#ef4444' }} />,
        shortcut: 'P O',
        action: () => {
          onClose();
          onTriggerPunch?.('out');
        },
      },
      {
        id: 'act-break',
        category: 'Actions',
        title: 'Take Break / Resume Shift',
        subtitle: 'Pause or restart your active work tracking timer',
        icon: <FreeBreakfastRoundedIcon fontSize="small" sx={{ color: '#f59e0b' }} />,
        shortcut: 'P B',
        action: () => {
          onClose();
          onTriggerBreak?.();
        },
      },
      {
        id: 'act-quick-leave',
        category: 'Actions',
        title: 'Quick Apply Leave Today',
        subtitle: 'Instant same-day emergency or sick leave request',
        icon: <FlashOnRoundedIcon fontSize="small" sx={{ color: '#eab308' }} />,
        shortcut: 'L T',
        action: () => {
          onClose();
          onQuickLeave?.();
        },
      },
      // Preferences & Tools
      {
        id: 'tool-theme',
        category: 'Preferences & Tools',
        title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: isDark ? 'Comfortable clean daytime theme' : 'Sleek OLED dark mode theme',
        icon: isDark ? (
          <LightModeRoundedIcon fontSize="small" sx={{ color: '#f59e0b' }} />
        ) : (
          <DarkModeRoundedIcon fontSize="small" sx={{ color: '#38bdf8' }} />
        ),
        shortcut: 'T M',
        action: () => {
          toggleColorMode();
          hapticPop();
        },
      },
      {
        id: 'tool-copy-report',
        category: 'Preferences & Tools',
        title: 'Copy Attendance Summary',
        subtitle: 'Copy monthly attendance and hours to clipboard',
        icon: <ContentCopyRoundedIcon fontSize="small" sx={{ color: '#6366f1' }} />,
        shortcut: 'C S',
        action: () => {
          onCopyReport?.();
          onClose();
        },
      },
      {
        id: 'tool-refresh',
        category: 'Preferences & Tools',
        title: 'Refresh All Workspace Data',
        subtitle: 'Reload latest punches, notifications and approval states',
        icon: <RefreshRoundedIcon fontSize="small" sx={{ color: '#0ea5e9' }} />,
        shortcut: 'R D',
        action: () => {
          onRefresh?.();
          onClose();
        },
      },
      {
        id: 'tool-kiosk',
        category: 'Preferences & Tools',
        title: 'Launch Front Desk Tablet Kiosk Mode',
        subtitle: 'Open full-screen kiosk punch terminal (/kiosk)',
        icon: <TabletRoundedIcon fontSize="small" sx={{ color: '#ec4899' }} />,
        shortcut: 'K M',
        action: () => {
          onClose();
          window.location.href = '/kiosk';
        },
      },
    ];
    return list;
  }, [isDark, onNavigateTab, onTriggerPunch, onTriggerBreak, onQuickLeave, onCopyReport, onRefresh, onClose, toggleColorMode]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(lower) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(lower)) ||
        c.category.toLowerCase().includes(lower)
    );
  }, [commands, query]);

  // Keep selected index in range
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      hapticTap();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      hapticTap();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        hapticSuccess();
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Group filtered results by category
  const grouped = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  let runningIndex = -1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            bgcolor: isDark ? 'rgba(3, 7, 18, 0.75)' : 'rgba(15, 23, 42, 0.45)',
          },
        },
      }}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, scale: 0.95, y: -16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: -12 },
        transition: { type: 'spring', stiffness: 450, damping: 30 },
        sx: {
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'}`,
          borderRadius: '20px',
          boxShadow: isDark
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            : '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
          m: 2,
        },
      }}
    >
      {/* Top Search Input */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
        }}
      >
        <SearchRoundedIcon sx={{ color: isDark ? '#38bdf8' : '#2563eb', fontSize: 24 }} />
        <TextField
          inputRef={inputRef}
          autoFocus
          fullWidth
          variant="standard"
          placeholder="Type a command or search action... (e.g. Punch, Leave, Theme)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: { xs: 15, sm: 16 },
              fontWeight: 600,
              color: 'text.primary',
            },
          }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.4,
            borderRadius: '6px',
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
          }}
        >
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary' }}>ESC</Typography>
        </Box>
      </Box>

      {/* Results List */}
      <Box
        ref={listRef}
        sx={{
          maxHeight: 380,
          overflowY: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {filteredCommands.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', fontWeight: 700, fontSize: 14 }}>
              No commands found for &ldquo;{query}&rdquo;
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: 12, mt: 0.5 }}>
              Try searching for &ldquo;punch&rdquo;, &ldquo;attendance&rdquo;, or &ldquo;theme&rdquo;
            </Typography>
          </Box>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <Box key={category} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography
                sx={{
                  px: 1.25,
                  py: 0.5,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                }}
              >
                {category}
              </Typography>

              {items.map((cmd) => {
                runningIndex += 1;
                const active = runningIndex === selectedIndex;
                const idx = runningIndex;

                return (
                  <Box
                    key={cmd.id}
                    onClick={() => {
                      hapticSuccess();
                      cmd.action();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.2,
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      bgcolor: active
                        ? isDark
                          ? 'rgba(56, 189, 248, 0.14)'
                          : 'rgba(37, 99, 235, 0.08)'
                        : 'transparent',
                      border: `1px solid ${
                        active
                          ? isDark
                            ? 'rgba(56, 189, 248, 0.3)'
                            : 'rgba(37, 99, 235, 0.2)'
                          : 'transparent'
                      }`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: '10px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        {cmd.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            fontSize: 14,
                            lineHeight: 1.2,
                            color: active ? (isDark ? '#38bdf8' : '#2563eb') : 'text.primary',
                          }}
                        >
                          {cmd.title}
                        </Typography>
                        {cmd.subtitle && (
                          <Typography
                            sx={{
                              color: 'text.secondary',
                              fontSize: 11,
                              mt: 0.25,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {cmd.subtitle}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {cmd.shortcut && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                        <Box
                          sx={{
                            px: 0.85,
                            py: 0.3,
                            borderRadius: '6px',
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
                          }}
                        >
                          <Typography sx={{ fontSize: 10, fontWeight: 800, color: 'text.secondary' }}>
                            {cmd.shortcut}
                          </Typography>
                        </Box>
                        {active && (
                          <KeyboardReturnRoundedIcon
                            sx={{ fontSize: 16, color: isDark ? '#38bdf8' : '#2563eb' }}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      {/* Footer Instructions */}
      <Box
        sx={{
          px: 2,
          py: 1.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'}`,
          bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              sx={{
                px: 0.6,
                py: 0.2,
                borderRadius: '4px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                fontSize: 10,
                fontWeight: 800,
                color: 'text.secondary',
              }}
            >
              ↑↓
            </Box>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Navigate</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box
              sx={{
                px: 0.6,
                py: 0.2,
                borderRadius: '4px',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                fontSize: 10,
                fontWeight: 800,
                color: 'text.secondary',
              }}
            >
              ↵
            </Box>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Select</Typography>
          </Box>
        </Box>
        <Typography sx={{ fontSize: 11, color: 'text.disabled', fontWeight: 600 }}>
          WorkTrack Spotlight
        </Typography>
      </Box>
    </Dialog>
  );
}
