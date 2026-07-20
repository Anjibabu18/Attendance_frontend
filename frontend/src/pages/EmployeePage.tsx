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
import PullToRefresh from 'react-simple-pull-to-refresh';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';

import { EmployeeProvider, useEmployee } from './employee/EmployeeContext';
import { DashboardTab } from './employee/DashboardTab';
import { AttendanceTab } from './employee/AttendanceTab';
import { RequestsTab } from './employee/RequestsTab';
type QuickRequestMode = 'leave' | 'work' | 'regularization';
import { MoreTab } from './employee/MoreTab';
import { LiveVerificationOverlay } from './employee/LiveVerificationOverlay';
import { api } from '../api/client';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { LayoutSkeleton } from '../components/LayoutSkeleton';
import { useThemeContext } from '../theme/ThemeContext';
import PermissionOnboardingOverlay from './employee/PermissionOnboardingOverlay';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import { hapticPop } from '../utils/haptics';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import { IconButton, Tooltip } from '@mui/material';

const tabs = [
  { label: 'Dashboard', subtitle: 'Today overview', icon: <DashboardRoundedIcon fontSize="small" /> },
  { label: 'Attendance', subtitle: 'Calendar and daily logs', icon: <CalendarMonthRoundedIcon fontSize="small" /> },
  { label: 'Requests', subtitle: 'Leave and corrections', icon: <FactCheckRoundedIcon fontSize="small" /> },
  { label: 'More', subtitle: 'Profile, reports, settings', icon: <TuneRoundedIcon fontSize="small" /> },
];

const pageVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
    opacity: 0,
    scale: 0.92,
    filter: 'blur(10px)',
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 350, damping: 35, mass: 0.8 },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
    opacity: 0,
    scale: 0.92,
    filter: 'blur(10px)',
    transition: { duration: 0.3, ease: 'easeInOut' },
  }),
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

function EmployeeContent() {
  const { loading, error, profile, refreshData } = useEmployee();
  const { mode, toggleColorMode } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);
  const [direction, setDirection] = useState(0);
  const [quickRequestMode, setQuickRequestMode] = useState<QuickRequestMode | null>(null);
  const [pendingVerificationId, setPendingVerificationId] = useState<number | null>(null);
  const [showPermissionsOverlay, setShowPermissionsOverlay] = useState(() => {
    return localStorage.getItem('app_permissions_requested') !== 'true';
  });
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1000], ['0%', '30%']);
  const bgOpacity = useTransform(scrollY, [0, 800], [1, 0.3]);
  const meshY = useTransform(scrollY, [0, 1000], ['0%', '15%']);
  const active = tabs[activeTab];

  React.useEffect(() => {
    if (loading || error) return;
    
    const checkVerification = async () => {
      try {
        const res = await api.get('/api/employee/live-verify/pending');
        if (res.data.pendingRequest && res.data.pendingRequest.id) {
          setPendingVerificationId(res.data.pendingRequest.id);
        } else {
          setPendingVerificationId(null);
        }
      } catch (err) {
        // Ignore poll errors silently
      }
    };

    checkVerification();
    const interval = setInterval(checkVerification, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [loading, error]);

  if (loading) {
    return <LayoutSkeleton />;
  }

  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'grid', placeItems: 'center', p: 3 }}>
        <Box component={motion.div} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} sx={{ width: 'min(520px, 100%)', bgcolor: 'background.paper', border: '1px solid #FECACA', borderRadius: '8px', p: 4, textAlign: 'center', boxShadow: '0 24px 70px rgba(127, 29, 29, 0.12)' }}>
          <Typography sx={{ color: 'error.main', fontWeight: 900, mb: 1 }}>Employee data could not load</Typography>
          <Typography sx={{ color: 'error.dark', fontSize: 14, mb: 2 }}>{error}</Typography>
          <Button onClick={refreshData} variant="contained" startIcon={<RefreshRoundedIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 900 }}>
            Retry
          </Button>
        </Box>
      </Box>
    );
  }

  const renderTab = () => {
    if (activeTab === 0) return <DashboardTab />;
    if (activeTab === 1) return <AttendanceTab />;
    if (activeTab === 2) return <RequestsTab initialMode={quickRequestMode} />;
    return <MoreTab onQuickRequest={(mode) => { setQuickRequestMode(mode); setDirection(1); setActiveTab(2); }} />;
  };

  const paginate = (newDirection: number) => {
    const nextTab = activeTab + newDirection;
    if (nextTab >= 0 && nextTab < tabs.length) {
      setDirection(newDirection);
      setActiveTab(nextTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh', color: 'text.primary',
        backgroundColor: 'background.default',
        position: 'relative',
        overflow: 'hidden', // Contain the parallax background
      }}
    >
      {/* Parallax Animated Aurora Background Layer */}
      <Box
        component={motion.div}
        style={{ y: bgY, opacity: bgOpacity }}
        sx={{
          position: 'absolute',
          inset: '-20%', // Make it larger than screen so it doesn't clip when scrolling
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: mode === 'dark' 
            ? 'radial-gradient(circle at 15% 50%, rgba(14,165,233,0.12), transparent 45%), radial-gradient(circle at 85% 30%, rgba(139,92,246,0.12), transparent 45%), linear-gradient(180deg, transparent 0%, rgba(15,23,42,0.9) 100%)'
            : 'radial-gradient(circle at 15% 50%, rgba(37,99,235,0.08), transparent 45%), radial-gradient(circle at 85% 30%, rgba(139,92,246,0.08), transparent 45%), linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.9) 100%)',
          backgroundSize: '100% 100%',
          animation: 'aurora 15s ease-in-out infinite alternate',
          '@keyframes aurora': {
            '0%': { backgroundPosition: '0% 0%', filter: 'hue-rotate(0deg)' },
            '50%': { backgroundPosition: '100% 100%', filter: 'hue-rotate(15deg)' },
            '100%': { backgroundPosition: '0% 0%', filter: 'hue-rotate(0deg)' }
          }
        }}
      />
      {/* Mesh Grid Layer */}
      <Box
        component={motion.div}
        style={{ y: meshY }}
        sx={{
          position: 'absolute',
          inset: '-50%', // Larger to allow for pan
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: mode === 'dark'
            ? 'linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.03) 1px, transparent 1px)'
            : 'linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(180deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
          backgroundSize: '34px 34px',
          animation: 'mesh-pan 30s linear infinite',
          '@keyframes mesh-pan': {
            '0%': { transform: 'translate(0, 0)' },
            '100%': { transform: 'translate(-34px, -34px)' } // Pan exactly one grid square
          }
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, display: { xs: 'block', md: 'grid' }, gridTemplateColumns: { md: '280px 1fr' }, minHeight: '100vh' }}>
        <Box
          component={motion.aside}
          initial={{ x: -18, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          sx={{
            display: { xs: 'none', md: 'flex' }, position: 'sticky', top: 0, height: '100vh',
            flexDirection: 'column', p: 2.5, gap: 2,
            bgcolor: 'background.paper',
            borderRight: '1px solid', borderColor: 'divider', boxShadow: '8px 0 36px rgba(0,0,0,0.04)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1, py: 1.25 }}>
            <Box component={motion.div} whileHover={{ rotate: -6, scale: 1.06 }} sx={{ width: 42, height: 42, borderRadius: '8px', bgcolor: 'primary.main', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 900, boxShadow: '0 14px 28px rgba(37, 99, 235, 0.22)' }}>WT</Box>
            <Box>
              <Typography sx={{ fontWeight: 900, lineHeight: 1 }}>VD Attendance</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>Employee Portal</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 0.85, mt: 1 }}>
            {tabs.map((tab, index) => {
              const selected = activeTab === index;
              return (
                <Button
                  key={tab.label}
                  onClick={() => { 
                    if (index !== 2) setQuickRequestMode(null); 
                    setDirection(index > activeTab ? 1 : index < activeTab ? -1 : 0);
                    setActiveTab(index); 
                  }}
                  sx={{
                    position: 'relative', justifyContent: 'flex-start', textTransform: 'none', borderRadius: '8px', px: 1.3, py: 1.15,
                    color: selected ? 'primary.main' : 'text.secondary', bgcolor: 'transparent', fontWeight: 900, overflow: 'hidden',
                    '&:hover': { bgcolor: selected ? 'transparent' : 'action.hover' },
                  }}
                >
                  {selected && (
                    <Box component={motion.span} layoutId="employee-nav-active" transition={{ type: 'spring', stiffness: 420, damping: 34 }} sx={{ position: 'absolute', inset: 0, bgcolor: 'action.selected', border: '1px solid', borderColor: 'divider', borderRadius: '8px' }} />
                  )}
                  <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                    <Box component={motion.span} animate={selected ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 0.32 }} sx={{ display: 'flex' }}>{tab.icon}</Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 14, lineHeight: 1.1 }}>{tab.label}</Typography>
                      <Typography sx={{ color: selected ? 'primary.main' : 'text.secondary', fontSize: 11, mt: 0.25 }}>{tab.subtitle}</Typography>
                    </Box>
                  </Box>
                </Button>
              );
            })}
          </Box>

          <Box component={motion.div} whileHover={{ y: -2 }} sx={{ mt: 'auto', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: '8px', bgcolor: 'background.default', display: 'flex', gap: 1.25, alignItems: 'center' }}>
            <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 42, height: 42 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 11 }}>Employee</Typography>
            </Box>
          </Box>
        </Box>

        <Box component="main" sx={{ minWidth: 0, pb: { xs: 9, md: 0 }, minHeight: '100vh' }}>
          <PullToRefresh 
            onRefresh={async () => { await refreshData(); hapticPop(); }}
            pullingContent={<Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}><RefreshRoundedIcon sx={{ animation: 'spin 2s linear infinite' }} /></Box>}
            refreshingContent={<Box sx={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main' }}><CircularProgress size={24} thickness={5} /></Box>}
            pullDownThreshold={70}
            maxPullDownDistance={95}
          >
            <Box sx={{ minHeight: '100vh' }}>
              <Box sx={{ position: 'sticky', top: 0, zIndex: 20, bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 1.5, md: 2 }, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
              <AnimatePresence mode="wait">
                <Box component={motion.div} key={active.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, md: 28 }, lineHeight: 1.05 }}>{active.label}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: { xs: 12, md: 14 }, mt: 0.5 }}>{active.subtitle}</Typography>
                </Box>
              </AnimatePresence>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Button component={motion.button} whileTap={{ scale: 0.96 }} onClick={refreshData} variant="outlined" startIcon={<RefreshRoundedIcon />} sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: '8px', textTransform: 'none', fontWeight: 900 }}>
                  Refresh
                </Button>

                {/* Dark Mode Toggle */}
                <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
                  <IconButton
                    component={motion.button}
                    onClick={toggleColorMode}
                    whileTap={{ scale: 0.85, rotate: 30 }}
                    whileHover={{ scale: 1.1 }}
                    sx={{
                      width: 40, height: 40,
                      borderRadius: '10px',
                      bgcolor: mode === 'dark' ? 'rgba(14,165,233,0.15)' : 'rgba(0,0,0,0.05)',
                      border: mode === 'dark' ? '1px solid rgba(14,165,233,0.4)' : '1px solid rgba(0,0,0,0.08)',
                      color: mode === 'dark' ? '#38BDF8' : '#64748B',
                      transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
                      boxShadow: mode === 'dark' ? '0 0 12px rgba(14,165,233,0.25)' : 'none',
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {mode === 'dark' ? (
                        <motion.span key="light" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                          <LightModeRoundedIcon fontSize="small" />
                        </motion.span>
                      ) : (
                        <motion.span key="dark" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                          <DarkModeRoundedIcon fontSize="small" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </IconButton>
                </Tooltip>

                <Avatar src={profile?.profilePhotoUrl || undefined} sx={{ width: 40, height: 40, display: { md: 'none' } }} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 1220, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 2, md: 3 }, overflowX: 'hidden' }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeTab}
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.8} // Liquid stretch effect
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    paginate(-1);
                  }
                }}
                style={{ touchAction: 'pan-y' }} // Allow vertical scroll, hijack horizontal
              >
                {renderTab()}
              </motion.div>
            </AnimatePresence>
          </Box>
            </Box>
          </PullToRefresh>
        </Box>

        <Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, px: 1.5, pb: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
          <Box sx={{ 
            bgcolor: 'background.paper', backdropFilter: 'blur(24px) saturate(200%)', 
            border: '1px solid', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '16px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)', overflow: 'hidden',
            display: 'flex', height: 68, px: 1, alignItems: 'center', justifyContent: 'space-between'
          }}>
            {tabs.map((tab, idx) => {
              const isActive = activeTab === idx;
              return (
                <Box
                  key={tab.label}
                  onClick={() => {
                    hapticPop();
                    if (idx !== 2) setQuickRequestMode(null);
                    setDirection(idx > activeTab ? 1 : idx < activeTab ? -1 : 0);
                    setActiveTab(idx);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  sx={{
                    position: 'relative', flex: 1, height: '100%', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', zIndex: 1, WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      style={{
                        position: 'absolute', top: 6, bottom: 6, left: 6, right: 6,
                        backgroundColor: mode === 'dark' ? 'rgba(14,165,233,0.15)' : 'rgba(37,99,235,0.1)',
                        borderRadius: '12px', zIndex: -1
                      }}
                    />
                  )}
                  <motion.div
                    animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.05 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{ color: isActive ? (mode === 'dark' ? '#38BDF8' : '#2563EB') : '#94A3B8' }}
                  >
                    {tab.icon}
                  </motion.div>
                  <motion.div
                    animate={{ y: isActive ? 0 : 2, opacity: isActive ? 1 : 0.6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <Typography sx={{ 
                      fontSize: 10, fontWeight: isActive ? 800 : 600, mt: 0.5,
                      color: isActive ? (mode === 'dark' ? '#38BDF8' : '#2563EB') : 'text.secondary' 
                    }}>
                      {tab.label}
                    </Typography>
                  </motion.div>
                </Box>
              );
            })}
          </Box>
        </Box>

      {pendingVerificationId && (
        <LiveVerificationOverlay
          requestId={pendingVerificationId}
          open={true}
          onSuccess={() => setPendingVerificationId(null)}
          onClose={() => setPendingVerificationId(null)}
        />
      )}
      {showPermissionsOverlay && (
        <PermissionOnboardingOverlay onClose={() => setShowPermissionsOverlay(false)} />
      )}
      </Box>
    </Box>
  );
}

export default function EmployeePage() {
  return (
    <EmployeeProvider>
      <ErrorBoundary>
        <EmployeeContent />
      </ErrorBoundary>
    </EmployeeProvider>
  );
}
