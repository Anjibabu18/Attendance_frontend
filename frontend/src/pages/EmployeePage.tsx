import React, { useState } from 'react';
import {
  Avatar,
  Box,
  BottomNavigation,
  BottomNavigationAction,
  Button,
  CircularProgress,
  Typography,
} from '@mui/material';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { AnimatePresence, motion } from 'framer-motion';

import { EmployeeProvider, useEmployee } from './employee/EmployeeContext';
import { DashboardTab } from './employee/DashboardTab';
import { AttendanceTab } from './employee/AttendanceTab';
import { RequestsTab } from './employee/RequestsTab';
type QuickRequestMode = 'leave' | 'work' | 'regularization';
import { MoreTab } from './employee/MoreTab';

const tabs = [
  { label: 'Dashboard', subtitle: 'Today overview', icon: <DashboardRoundedIcon fontSize="small" /> },
  { label: 'Attendance', subtitle: 'Calendar and daily logs', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
  { label: 'Requests', subtitle: 'Leave and corrections', icon: <FactCheckRoundedIcon fontSize="small" /> },
  { label: 'More', subtitle: 'Profile, reports, settings', icon: <TuneRoundedIcon fontSize="small" /> },
];

const pageVariants = {
  initial: { opacity: 0, y: 18, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(6px)' },
};

function EmployeeContent() {
  const { loading, error, profile, refreshData } = useEmployee();
  const [activeTab, setActiveTab] = useState(0);
  const [quickRequestMode, setQuickRequestMode] = useState<QuickRequestMode | null>(null);
  const active = tabs[activeTab];

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FB', display: 'grid', placeItems: 'center', p: 3 }}>
        <Box component={motion.div} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} sx={{ width: 'min(420px, 100%)', bgcolor: 'white', border: '1px solid #E3E8F0', borderRadius: '8px', p: 4, textAlign: 'center', boxShadow: '0 24px 70px rgba(15, 23, 42, 0.12)' }}>
          <Box component={motion.div} animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }} sx={{ display: 'inline-flex' }}>
            <CircularProgress size={42} thickness={4} sx={{ color: '#2563EB', mb: 2 }} />
          </Box>
          <Typography sx={{ fontWeight: 900, color: '#102033', mb: 0.5 }}>Loading employee workspace</Typography>
          <Typography sx={{ color: '#64748B', fontSize: 14 }}>Syncing attendance, requests, holidays, and reports.</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#F6F8FB', display: 'grid', placeItems: 'center', p: 3 }}>
        <Box component={motion.div} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} sx={{ width: 'min(520px, 100%)', bgcolor: 'white', border: '1px solid #FECACA', borderRadius: '8px', p: 4, textAlign: 'center', boxShadow: '0 24px 70px rgba(127, 29, 29, 0.12)' }}>
          <Typography sx={{ color: '#B91C1C', fontWeight: 900, mb: 1 }}>Employee data could not load</Typography>
          <Typography sx={{ color: '#7F1D1D', fontSize: 14, mb: 2 }}>{error}</Typography>
          <Button onClick={refreshData} variant="contained" startIcon={<RefreshRoundedIcon />} sx={{ bgcolor: '#2563EB', borderRadius: '8px', textTransform: 'none', fontWeight: 900 }}>
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  const renderTab = () => {
    if (activeTab === 0) return <DashboardTab />;
    if (activeTab === 1) return <AttendanceTab />;
    if (activeTab === 2) return <RequestsTab />;
    return <MoreTab />;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', color: '#0F172A',
        backgroundColor: '#F5F7FB',
        backgroundImage: 'linear-gradient(90deg, rgba(37,99,235,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(15,23,42,0.035) 1px, transparent 1px)',
        backgroundSize: '34px 34px',
      }}
    >
      <Box sx={{ display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '280px 1fr' }, minHeight: '100vh' }}>
        <Box
          component={motion.aside}
          initial={{ x: -18, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          sx={{
            display: { xs: 'none', md: 'flex' }, position: 'sticky', top: 0, height: '100vh',
            flexDirection: 'column', p: 2.5, gap: 2,
            bgcolor: 'rgba(255,255,255,0.86)', backdropFilter: 'blur(18px)',
            borderRight: '1px solid rgba(226,232,240,0.9)', boxShadow: '8px 0 36px rgba(15,23,42,0.04)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1, py: 1.25 }}>
            <Box component={motion.div} whileHover={{ rotate: -6, scale: 1.06 }} sx={{ width: 42, height: 42, borderRadius: '8px', bgcolor: '#0F2F5F', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900, boxShadow: '0 14px 28px rgba(15, 47, 95, 0.22)' }}>WT</Box>
            <Box>
              <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>WorkTrack</Typography>
              <Typography sx={{ color: '#64748B', fontSize: 12 }}>Employee Portal</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 0.85, mt: 1 }}>
            {tabs.map((tab, index) => {
              const selected = activeTab === index;
              return (
                <Button
                  key={tab.label}
                  onClick={() => { if (index !== 2) setQuickRequestMode(null); setActiveTab(index); }}
                  sx={{
                    position: 'relative', justifyContent: 'flex-start', textTransform: 'none', borderRadius: '8px', px: 1.3, py: 1.15,
                    color: selected ? '#1D4ED8' : '#475569', bgcolor: 'transparent', fontWeight: 900, overflow: 'hidden',
                    '&:hover': { bgcolor: selected ? 'transparent' : '#F8FAFC' },
                  }}
                >
                  {selected && (
                    <Box component={motion.span} layoutId="employee-nav-active" transition={{ type: 'spring', stiffness: 420, damping: 34 }} sx={{ position: 'absolute', inset: 0, bgcolor: '#EFF6FF', border: '1px solid #DBEAFE', borderRadius: '8px' }} />
                  )}
                  <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Box component={motion.span} animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.32 }} sx={{ display: 'flex' }}>{tab.icon}</Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.1 }}>{tab.label}</Typography>
                      <Typography sx={{ color: selected ? '#2563EB' : '#94A3B8', fontSize: 11, mt: 0.25 }}>{tab.subtitle}</Typography>
                    </Box>
                  </Box>
                </Button>
              );
            })}
          </Box>

          <Box component={motion.div} whileHover={{ y: -2 }} sx={{ mt: 'auto', p: 1.5, border: '1px solid #E3E8F0', borderRadius: '8px', bgcolor: '#F8FAFC', display: 'flex', gap: 1.25, alignItems: 'center' }}>
            <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 42, height: 42 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile?.name || 'Employee'}</Typography>
              <Typography sx={{ color: '#64748B', fontSize: 12 }}>{profile?.employeeNumber || 'Active'}</Typography>
            </Box>
          </Box>
        </Box>

        <Box component="main" sx={{ minWidth: 0, pb: { xs: 9, md: 0 } }}>
          <Box sx={{ position: 'sticky', top: 0, zIndex: 20, bgcolor: 'rgba(245, 247, 251, 0.82)', backdropFilter: 'blur(18px)', borderBottom: '1px solid rgba(226, 232, 240, 0.86)' }}>
            <Box sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1.5, md: 2 }, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
              <AnimatePresence mode="wait">
                <Box component={motion.div} key={active.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, md: 28 }, lineHeight: 1.05 }}>{active.label}</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: { xs: 12, md: 14 }, mt: 0.5 }}>{active.subtitle}</Typography>
                </Box>
              </AnimatePresence>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Button component={motion.button} whileTap={{ scale: 0.96 }} onClick={refreshData} variant="outlined" startIcon={<RefreshRoundedIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderColor: '#CBD5E1', color: '#0F172A', borderRadius: '8px', textTransform: 'none', fontWeight: 900, bgcolor: 'rgba(255,255,255,0.72)' }}>
                  Refresh
                </Button>
                <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 40, height: 40, display: { md: 'none' } }} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, md: 3 } }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, px: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.94)', backdropFilter: 'blur(16px)', border: '1px solid #E3E8F0', borderRadius: '8px', boxShadow: '0 -18px 42px rgba(15,23,42,0.12)', overflow: 'hidden' }}>
          <BottomNavigation
            showLabels
            value={activeTab}
            onChange={(event, newValue) => {
              if (newValue !== 2) setQuickRequestMode(null);
              setActiveTab(newValue);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              bgcolor: 'transparent', height: 66,
              '& .MuiBottomNavigationAction-root': { color: '#94A3B8', minWidth: 'auto', px: 0.5 },
              '& .Mui-selected': { color: '#2563EB' },
              '& .MuiBottomNavigationAction-label': { fontSize: 11, fontWeight: 800, mt: 0.35 },
            }}
          >
            {tabs.map((tab) => <BottomNavigationAction key={tab.label} label={tab.label} icon={tab.icon} />)}
          </BottomNavigation>
        </Box>
      </Box>
    </Box>
  );
}

export default function EmployeePage() {
  return (
    <EmployeeProvider>
      <EmployeeContent />
    </EmployeeProvider>
  );
}
