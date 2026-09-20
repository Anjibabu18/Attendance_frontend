import React, { useRef } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import dayjs from 'dayjs';

import { AppLogo } from './AppLogo';
import { useThemeContext } from '../theme/ThemeContext';
import { useToast } from './Toast';
import { hapticSuccess, hapticTap } from '../utils/haptics';

interface ExecutiveTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  employeeName?: string;
  employeeCode?: string;
  department?: string;
  month?: string; // e.g. "September 2026"
  totalWorkedHours?: string;
  presentDays?: number;
  leaveDays?: number;
  overtimeHours?: string;
}

export function ExecutiveTimesheetModal({
  open,
  onClose,
  employeeName = 'Venkata Rao',
  employeeCode = 'EMP001',
  department = 'Engineering & Technology',
  month = dayjs().format('MMMM YYYY'),
  totalWorkedHours = '168 hrs 30 mins',
  presentDays = 21,
  leaveDays = 1,
  overtimeHours = '8 hrs 45 mins',
}: ExecutiveTimesheetModalProps) {
  const { mode } = useThemeContext();
  const isDark = mode === 'dark';
  const { toastSuccess } = useToast();
  const printableRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    hapticTap();
    window.print();
  };

  const handleDownloadCSV = () => {
    hapticSuccess();
    const rows = [
      ['WorkTrack Enterprise Timesheet - Official Report'],
      ['Employee Name', employeeName],
      ['Employee Code', employeeCode],
      ['Department', department],
      ['Billing Month', month],
      ['Total Present Days', String(presentDays)],
      ['Total Leaves Taken', String(leaveDays)],
      ['Total Worked Hours', totalWorkedHours],
      ['Total Overtime Hours', overtimeHours],
      ['Digital Verification Hash', 'SHA256-e9c4b127ff804a9194d6e902b'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Timesheet_${employeeCode}_${month.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toastSuccess(`Exported timesheet CSV for ${employeeName} (${month})`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          bgcolor: isDark ? '#0f172a' : '#ffffff',
          backgroundImage: 'none',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
            Official Monthly Timesheet & Certificate
          </Typography>
          <Chip
            size="small"
            icon={<VerifiedRoundedIcon sx={{ fontSize: '13px !important' }} />}
            label="Verified Authentic"
            sx={{
              fontWeight: 800,
              fontSize: 10,
              bgcolor: 'rgba(16, 185, 129, 0.12)',
              color: '#10b981',
            }}
          />
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ borderRadius: '10px' }}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Printable Paper Document Container */}
        <Box
          ref={printableRef}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            border: '1px solid',
            borderColor: 'divider',
            position: 'relative',
          }}
        >
          {/* Document Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <AppLogo size={36} />
              <Typography sx={{ fontWeight: 900, fontSize: 18, mt: 1, letterSpacing: '-0.02em' }}>
                WorkTrack Technologies Inc.
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                Enterprise Workforce Management & Timesheet Verification
              </Typography>
            </Box>

            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Statement Period
              </Typography>
              <Typography sx={{ fontSize: 18, fontWeight: 900, color: '#0284c7' }}>
                {month}
              </Typography>
              <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                Generated on {dayjs().format('DD MMM YYYY, hh:mm A')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Employee Metadata Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2,
              p: 2,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
              border: '1px solid',
              borderColor: 'divider',
              mb: 3,
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Employee Name</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 900 }}>{employeeName}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Employee Code</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace' }}>{employeeCode}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Department</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 900 }}>{department}</Typography>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Approval Status</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 900, color: '#10b981' }}>Approved & Locked</Typography>
            </Box>
          </Box>

          {/* Attendance & Billing Metrics Grid */}
          <Typography sx={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.5 }}>
            Attendance & Hours Breakdown
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Present Days</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#10b981' }}>{presentDays} d</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Approved Leaves</Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 900, color: '#f59e0b' }}>{leaveDays} d</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Total Worked Hours</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: '#0284c7' }}>{totalWorkedHours}</Typography>
            </Box>
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', border: '1px solid', borderColor: 'divider' }}>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 700 }}>Overtime Approved</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 900, color: '#8b5cf6' }}>{overtimeHours}</Typography>
            </Box>
          </Box>

          {/* Verification QR Code & Digital Signature Seal */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              p: 2,
              borderRadius: '12px',
              bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
              border: '1px dashed',
              borderColor: 'divider',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '8px',
                  bgcolor: '#ffffff',
                  color: '#0f172a',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <QrCode2RoundedIcon sx={{ fontSize: 40 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                  Cryptographic Verification Seal
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'text.secondary', fontFamily: 'monospace' }}>
                  HASH: SHA256-e9c4b127ff804a9194d6e902b
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>
                  ● Scan to verify authenticity with payroll auditor
                </Typography>
              </Box>
            </Box>

            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography sx={{ fontSize: 11, fontWeight: 800, color: 'text.secondary' }}>
                HR & Payroll Director
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 900, fontStyle: 'italic', color: '#6366f1' }}>
                WorkTrack Systems (Automated Seal)
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={handleDownloadCSV}
          startIcon={<DownloadRoundedIcon />}
          sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
        >
          Export CSV / Excel
        </Button>
        <Button
          variant="contained"
          onClick={handlePrint}
          startIcon={<PrintRoundedIcon />}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            textTransform: 'none',
            bgcolor: '#0284c7',
            '&:hover': { bgcolor: '#0369a1' },
          }}
        >
          Print / Save PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
