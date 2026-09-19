import React, { useEffect, useState } from 'react';
import { Avatar, Box, Button, Divider, List, ListItemButton, ListItemIcon, ListItemText, Switch, Typography, Dialog, DialogTitle, DialogContent, IconButton, CircularProgress } from '@mui/material';
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
import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { useThemeContext } from '../../theme/ThemeContext';

import { api } from '../../api/client';
import { clearAuth } from '../../auth/auth';
import { disablePushNotifications, enablePushNotifications, isPushEnabled, sendTestNotification } from '../../utils/pushNotifications';
import { useEmployee } from './EmployeeContext';
import { registerBiometric, isBiometricSupported } from '../../utils/webauthn';
import { hapticTap, hapticPop } from '../../utils/haptics';

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
  const { profile, month, leaveBalances, monthSummary, payslip, deviceStatus, refreshData } = useEmployee();
  const { mode, toggleColorMode } = useThemeContext();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const biometricSupported = isBiometricSupported();
  
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [userDevices, setUserDevices] = useState<any[]>([]);

  const openDeviceDialog = async () => {
    setDeviceDialogOpen(true);
    setDevicesLoading(true);
    try {
      const res = await api.get('/api/account/devices/all');
      setUserDevices(res.data);
    } catch (e) {
      alert('Failed to load devices');
    } finally {
      setDevicesLoading(false);
    }
  };

  const removeDevice = async (id: number) => {
    hapticTap();
    if (!window.confirm('Remove this device?')) return;
    try {
      await api.delete(`/api/account/devices/${id}`);
      await refreshData();
      setUserDevices(prev => prev.filter(d => d.id !== id));
      alert('Device removed.');
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const registerCurrentDevice = async () => {
    hapticTap();
    try {
      const deviceId = localStorage.getItem("attendance_device_id_v1") || 'unknown';
      let label = navigator.userAgent;
      if (label.includes('iPhone')) label = 'Apple iPhone';
      else if (label.includes('Android')) label = 'Android Phone';
      else if (label.includes('Windows')) label = 'Windows PC';
      else if (label.includes('Mac')) label = 'Macbook';
      else label = 'Mobile Device';

      await api.post('/api/account/devices/register', { deviceId, label });
      alert('Device registered! It is now awaiting Admin approval.');
      await refreshData();
      openDeviceDialog();
    } catch (e: any) {
      alert(e.response?.data?.error || e.message);
    }
  };

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
      alert(err.response?.data?.error || err.message || 'Failed to toggle push notifications');
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
            <ListItemText
              primary="Appearance"
              secondary={mode === 'dark' ? '🌙 Dark Mode active' : '☀️ Light Mode active'}
              primaryTypographyProps={{ fontWeight: 900 }}
              secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }}
            />
            {/* Premium animated pill toggle */}
            <Box
              component={motion.div}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleColorMode(); }}
              whileTap={{ scale: 0.92 }}
              sx={{
                position: 'relative',
                width: 64,
                height: 32,
                borderRadius: 999,
                bgcolor: mode === 'dark' ? 'rgba(14,165,233,0.25)' : 'rgba(0,0,0,0.08)',
                border: mode === 'dark' ? '1.5px solid rgba(14,165,233,0.5)' : '1.5px solid rgba(0,0,0,0.12)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                px: 0.5,
                transition: 'background 0.4s ease, border-color 0.4s ease',
                boxShadow: mode === 'dark' ? '0 0 12px rgba(14,165,233,0.3)' : 'none',
                flexShrink: 0,
              }}
            >
              <Box
                component={motion.div}
                animate={{ x: mode === 'dark' ? 30 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                sx={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  bgcolor: mode === 'dark' ? '#0EA5E9' : '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: mode === 'dark'
                    ? '0 0 10px rgba(14,165,233,0.6), 0 2px 6px rgba(0,0,0,0.3)'
                    : '0 2px 6px rgba(0,0,0,0.15)',
                  color: mode === 'dark' ? 'white' : '#94A3B8',
                  fontSize: 14,
                }}
              >
                {mode === 'dark' ? '🌙' : '☀️'}
              </Box>
            </Box>
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
          <ListItemButton onClick={openDeviceDialog} sx={{ py: 1.4 }}>
            <ListItemIcon sx={{ color: 'primary.main', minWidth: 44 }}>
              <DevicesRoundedIcon />
            </ListItemIcon>
            <ListItemText
              primary="Manage Devices"
              secondary={`${deviceStatus?.registered ? 'This device is registered' : 'This device is NOT registered'}`}
              primaryTypographyProps={{ fontWeight: 900 }}
              secondaryTypographyProps={{ color: 'text.secondary', fontSize: 13 }}
            />
            <ArrowForwardIosRoundedIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
          </ListItemButton>
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

          <ListItemButton onClick={handleLogout} sx={{ py: 1.4 }}>
            <ListItemIcon sx={{ color: '#DC2626', minWidth: 44 }}><LogoutRoundedIcon /></ListItemIcon>
            <ListItemText primary="Log Out" primaryTypographyProps={{ fontWeight: 900, color: '#DC2626' }} />
          </ListItemButton>
        </List>
      </Box>

      <Dialog open={deviceDialogOpen} onClose={() => setDeviceDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
          Manage Devices ({userDevices.length}/3)
          <IconButton onClick={() => setDeviceDialogOpen(false)} size="small"><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {devicesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
          ) : userDevices.length === 0 ? (
            <Typography sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>No devices registered yet.</Typography>
          ) : (
            <List disablePadding>
              {userDevices.map(d => (
                <Box key={d.id} sx={{ mb: 1, border: '1px solid', borderColor: 'divider', borderRadius: '12px', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: d.deviceId === deviceStatus?.deviceId ? 'primary.50' : 'transparent' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{d.label || 'Mobile Device'}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Status: {d.approved ? 'Approved' : 'Pending'}</Typography>
                    {d.deviceId === deviceStatus?.deviceId && <Typography sx={{ fontSize: 11, color: 'primary.main', fontWeight: 800 }}>CURRENT DEVICE</Typography>}
                  </Box>
                  <IconButton color="error" onClick={() => removeDevice(d.id)}><DeleteRoundedIcon /></IconButton>
                </Box>
              ))}
            </List>
          )}
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={registerCurrentDevice} 
              disabled={userDevices.length >= 3}
              sx={{ borderRadius: 8, py: 1.5, fontWeight: 800 }}
            >
              {userDevices.length >= 3 ? 'Maximum Devices Reached' : deviceStatus?.registered ? 'Register Another Device' : 'Register This Device'}
            </Button>
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2, textAlign: 'center' }}>You can register up to 3 devices to punch in from.</Typography>
        </DialogContent>
      </Dialog>
    </MotionBox>
  );
}





