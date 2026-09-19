import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, Switch, Typography } from '@mui/material';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { useThemeContext } from '../../theme/ThemeContext';

import { api } from '../../api/client';
import { clearAuth } from '../../auth/auth';
import { disablePushNotifications, enablePushNotifications, isPushEnabled, sendTestNotification } from '../../utils/pushNotifications';
import { useEmployee } from './EmployeeContext';
import { registerBiometric, isBiometricSupported } from '../../utils/webauthn';
import { FaceRegisterOverlay } from './FaceRegisterOverlay';

const MotionBox = motion.create(Box);

const cardSx = {
  bgcolor: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '8px',
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.05)',
  transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 18px 44px rgba(15, 23, 42, 0.09)',
    borderColor: 'primary.light',
  },
};

export function MoreTab({ onQuickRequest }: { onQuickRequest?: (mode: 'leave' | 'work' | 'regularization') => void }) {
  const { profile, month, leaveBalances, monthSummary, payslip, deviceStatus } = useEmployee();
  const { mode, toggleColorMode } = useThemeContext();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [showFaceRegister, setShowFaceRegister] = useState(false);
  const biometricSupported = isBiometricSupported();

  useEffect(() => {
    setPushEnabled(isPushEnabled());
  }, []);

  const handleTogglePush = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setPushLoading(true);
    try {
      if (event.target.checked) {
        await enablePushNotifications();
        setPushEnabled(true);
      } else {
        await disablePushNotifications();
        setPushEnabled(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle push notifications');
    } finally {
      setPushLoading(false);
    }
  };

  const handleRegisterBiometric = async () => {
    setBiometricLoading(true);
    try {
      await registerBiometric();
      alert('Biometric registered! You can now log in with FaceID/Fingerprint.');
    } catch (err: any) {
      alert(err.message || 'Biometric registration failed. Please try again.');
    } finally {
      setBiometricLoading(false);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const exportAttendance = async (format: 'csv' | 'pdf') => {
    const endpoint = format === 'csv' ? '/api/employee/attendance/export' : '/api/employee/attendance/report.pdf';
    const response = await api.get<Blob>(endpoint, { params: { month }, responseType: 'blob' });
    downloadBlob(response.data, `my-attendance-${month}.${format}`);
  };

  const handleLogout = () => {
    clearAuth();
    window.location.replace('/login');
  };

  const totalLeave = leaveBalances.reduce((sum, item) => sum + item.remainingDays, 0);
  const quickActions: Array<{ label: string; mode: 'leave' | 'work' | 'regularization' }> = [
    { label: 'Apply Leave', mode: 'leave' },
    { label: 'WFH Request', mode: 'work' },
    { label: 'Correction', mode: 'regularization' },
  ];

  return (
    <MotionBox initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, minWidth: 0 }}>
          <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 72, height: 72, border: '4px solid #EFF6FF' }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 30 }, lineHeight: 1.05, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name || 'Employee'}</Typography>
            <Typography sx={{ color: '#64748B', mt: 0.5 }}>{profile?.employeeNumber || '--'} - {profile?.department?.name || 'Department not assigned'}</Typography>
            <Typography sx={{ color: '#64748B', fontSize: 13 }}>{profile?.companyRole?.name || 'Employee'} - {profile?.shift?.name || 'No shift assigned'}</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, minWidth: { md: 260 } }}>
          <Box sx={{ bgcolor: '#EFF6FF', borderRadius: '8px', p: 1.5 }}>
            <Typography sx={{ color: '#1D4ED8', fontWeight: 800, fontSize: 12 }}>Leave wallet</Typography>
            <Typography sx={{ color: '#1D4ED8', fontWeight: 900, fontSize: 24 }}>{totalLeave}d</Typography>
          </Box>
          <Box sx={{ bgcolor: deviceStatus?.approved ? '#DCFCE7' : '#FEF3C7', borderRadius: '8px', p: 1.5 }}>
            <Typography sx={{ color: deviceStatus?.approved ? '#166534' : '#92400E', fontWeight: 800, fontSize: 12 }}>Device</Typography>
            <Typography sx={{ color: deviceStatus?.approved ? '#166534' : '#92400E', fontWeight: 900, fontSize: 16 }}>{deviceStatus?.approved ? 'Approved' : 'Pending'}</Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 2.5 }}>
        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>Quick actions</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {quickActions.map((action) => (
              <Box key={action.label} component="button" onClick={() => onQuickRequest?.(action.mode)} sx={{ border: '1px solid #E2E8F0', bgcolor: '#F8FAFC', borderRadius: '8px', p: 1.5, minHeight: 94, display: 'grid', placeItems: 'center', gap: 1, cursor: 'pointer', color: '#0F172A' }}>
                <Box sx={{ width: 34, height: 34, borderRadius: '8px', bgcolor: '#EFF6FF', color: '#2563EB', display: 'grid', placeItems: 'center' }}><AddRoundedIcon fontSize="small" /></Box>
                <Typography sx={{ fontWeight: 900, fontSize: 12, textAlign: 'center' }}>{action.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{ ...cardSx, p: 2.25 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>Reports</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.25 }}>
            <Button onClick={() => exportAttendance('csv')} variant="outlined" startIcon={<DownloadRoundedIcon />} sx={{ justifyContent: 'flex-start', borderColor: '#CBD5E1', borderRadius: '8px', color: '#0F172A', textTransform: 'none', fontWeight: 900, p: 1.5 }}>
              Attendance CSV
            </Button>
            <Button onClick={() => exportAttendance('pdf')} variant="outlined" startIcon={<InsertDriveFileRoundedIcon />} sx={{ justifyContent: 'flex-start', borderColor: '#CBD5E1', borderRadius: '8px', color: '#0F172A', textTransform: 'none', fontWeight: 900, p: 1.5 }}>
              Attendance PDF
            </Button>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 1.5 }}>
            {[
              ['Month', dayjs(`${month}-01`).format('MMM YYYY')],
              ['Worked', `${Math.floor((monthSummary?.totalWorkedMinutes || 0) / 60)}h`],
              ['Net pay', payslip ? `Rs ${Math.round(payslip.netPay)}` : '--'],
            ].map(([label, value]) => (
              <Box key={label} sx={{ bgcolor: 'background.default', borderRadius: '8px', p: 1.25 }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>{label}</Typography>
                <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box sx={{ ...cardSx, p: 2.25 }}>
        <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 1.5 }}>Leave balance</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 1 }}>
          {leaveBalances.length ? leaveBalances.map((item) => (
            <Box key={item.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', p: 1.5, display: 'flex', justifyContent: 'space-between', gap: 1.5, alignItems: 'center' }}>
              <Box>
                <Typography sx={{ fontWeight: 900 }}>{item.leaveType.replaceAll('_', ' ')}</Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{item.usedDays} used of {item.allocatedDays} in {item.year}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: 22, color: item.remainingDays > 0 ? 'success.main' : 'error.main' }}>{item.remainingDays}d</Typography>
            </Box>
          )) : <Typography sx={{ color: 'text.secondary' }}>No leave balances assigned yet.</Typography>}
        </Box>
      </Box>

      <Box sx={{ ...cardSx, overflow: 'hidden' }}>
        <List disablePadding>
          {[
            { icon: <PersonRoundedIcon />, primary: 'My Profile', secondary: profile?.assignedOfficeLocation?.officeName || 'Office location not assigned' },
            { icon: <AccountBalanceWalletRoundedIcon />, primary: 'Payroll & Leave', secondary: payslip ? `Payable days ${payslip.payableDays}` : 'Payslip will appear after payroll calculation' },
            { icon: <AccessTimeRoundedIcon />, primary: 'Overtime', secondary: `${payslip?.overtimeMinutes || 0} minutes for ${dayjs(`${month}-01`).format('MMM YYYY')}` },
            { icon: <SettingsRoundedIcon />, primary: 'Settings', secondary: 'Attendance preferences and account controls' },
          ].map((item) => (
            <React.Fragment key={item.primary}>
              <ListItemButton sx={{ py: 1.4 }}>
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 44 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.primary} secondary={item.secondary} primaryTypographyProps={{ fontWeight: 900 }} secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }} />
                <ArrowForwardIosRoundedIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
              </ListItemButton>
              <Divider />
            </React.Fragment>
          ))}

          <ListItemButton onClick={toggleColorMode} sx={{ py: 1.4 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 44 }}>
              {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
            </ListItemIcon>
            <ListItemText primary="Appearance" secondary={mode === 'dark' ? 'Dark Mode' : 'Light Mode'} primaryTypographyProps={{ fontWeight: 900 }} secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }} />
            <Switch checked={mode === 'dark'} color="primary" />
          </ListItemButton>
          <Divider />

          <ListItemButton sx={{ py: 1.4 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 44 }}><NotificationsActiveRoundedIcon /></ListItemIcon>
            <ListItemText primary="Push Notifications" secondary="Check-in, checkout, and approval alerts" primaryTypographyProps={{ fontWeight: 900 }} secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }} />
            <Switch checked={pushEnabled} onChange={handleTogglePush} color="primary" disabled={pushLoading} />
          </ListItemButton>
          {pushEnabled && (
            <ListItemButton onClick={() => sendTestNotification().catch((err) => alert(err.message))} sx={{ py: 1.2, pl: 7 }}>
              <ListItemText primary="Test notification" primaryTypographyProps={{ color: 'primary.main', fontWeight: 900 }} />
            </ListItemButton>
          )}
          <Divider />
          {biometricSupported && (
            <>
              <ListItemButton onClick={handleRegisterBiometric} disabled={biometricLoading} sx={{ py: 1.4 }}>
                <ListItemIcon sx={{ color: 'primary.main', minWidth: 44 }}>
                  <SettingsRoundedIcon />
                </ListItemIcon>
                <ListItemText
                  primary={biometricLoading ? "Registering..." : "Setup Biometric Login"}
                  secondary="Enable FaceID or Fingerprint for this device"
                  primaryTypographyProps={{ fontWeight: 900 }}
                  secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }}
                />
                <ArrowForwardIosRoundedIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
              </ListItemButton>
              <Divider />
            </>
          )}
          <ListItemButton onClick={() => setShowFaceRegister(true)} sx={{ py: 1.4 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 44 }}>
              <PersonRoundedIcon />
            </ListItemIcon>
            <ListItemText
              primary="Register Face AI"
              secondary="Set up facial recognition for punching in"
              primaryTypographyProps={{ fontWeight: 900 }}
              secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }}
            />
            <ArrowForwardIosRoundedIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
          </ListItemButton>
          <Divider />

          <ListItemButton onClick={handleLogout} sx={{ py: 1.4 }}>
            <ListItemIcon sx={{ color: '#DC2626', minWidth: 44 }}><LogoutRoundedIcon /></ListItemIcon>
            <ListItemText primary="Log Out" primaryTypographyProps={{ fontWeight: 900, color: '#DC2626' }} />
          </ListItemButton>
        </List>
      </Box>

      {showFaceRegister && (
        <FaceRegisterOverlay onClose={() => setShowFaceRegister(false)} />
      )}
    </MotionBox>
  );
}





