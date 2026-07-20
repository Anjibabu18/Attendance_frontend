import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import HomeWorkRoundedIcon from '@mui/icons-material/HomeWorkRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import PaidRoundedIcon from '@mui/icons-material/PaidRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

import { api } from '../../api/client';
import { useEmployee } from './EmployeeContext';
import { EmptyState } from '../../components/EmptyState';

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

type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'CANCELLATION_REQUESTED' | 'MANAGER_RECOMMENDED';
type RequestMode = 'leave' | 'work' | 'regularization' | 'compOff';

type RequestItem = {
  id: string;
  type: string;
  title: string;
  date: string;
  detail: string;
  reason: string;
  status: RequestStatus;
  createdAt: string;
  icon: React.ReactNode;
};

const requestModes: Array<{ mode: RequestMode; label: string }> = [
  { mode: 'leave', label: 'Leave' },
  { mode: 'work', label: 'WFH / Duty' },
  { mode: 'regularization', label: 'Correction' },
  { mode: 'compOff', label: 'Comp Off' },
];

function statusStyle(status: RequestStatus) {
  if (status === 'APPROVED') return { bg: 'success.light', color: 'success.dark', label: 'Approved' };
  if (status === 'REJECTED' || status === 'CANCELLED') return { bg: 'error.light', color: 'error.dark', label: status === 'CANCELLED' ? 'Cancelled' : 'Rejected' };
  if (status === 'MANAGER_RECOMMENDED') return { bg: 'info.light', color: 'info.dark', label: 'Manager OK' };
  if (status === 'CANCELLATION_REQUESTED') return { bg: 'warning.light', color: 'warning.dark', label: 'Cancel requested' };
  return { bg: 'warning.light', color: 'warning.dark', label: 'Pending' };
}

function daysBetween(from: string, to: string) {
  const start = dayjs(from);
  const end = dayjs(to);
  if (!start.isValid() || !end.isValid()) return '1 day';
  const days = end.diff(start, 'day') + 1;
  return `${Math.max(1, days)} day${days === 1 ? '' : 's'}`;
}

function parseTimeValue(value?: string | null) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const timeOnly = /^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed);
  const normalized = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
  const parsed = timeOnly ? dayjs(`2000-01-01T${normalized}`) : dayjs(trimmed);
  return parsed.isValid() ? parsed : null;
}

function timeLabel(value?: string | null) {
  const parsed = parseTimeValue(value);
  return parsed ? parsed.format('hh:mm A') : '--';
}

function initialForm() {
  const today = dayjs().format('YYYY-MM-DD');
  return {
    fromDate: today,
    toDate: today,
    date: today,
    leaveType: 'CASUAL_LEAVE',
    workType: 'WORK_FROM_HOME',
    inTime: '09:30',
    outTime: '18:30',
    overtimeDate: today,
    requestedDate: today,
    overtimeMinutes: 60,
    reason: '',
  };
}

export function RequestsTab({ initialMode }: { initialMode?: RequestMode | null }) {
  const { leaveRequests, workRequests, regularizationRequests, compOffRequests, refreshRequests } = useEmployee();
  const [filter, setFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<RequestMode>('leave');
  const [form, setForm] = useState(initialForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const requests = useMemo<RequestItem[]>(() => {
    const leaveItems = leaveRequests.map((item) => ({
      id: `leave-${item.id}`,
      type: 'Leave',
      title: item.leaveType ? item.leaveType.replaceAll('_', ' ') : 'Leave Request',
      date: `${dayjs(item.fromDate).format('DD MMM')} - ${dayjs(item.toDate).format('DD MMM YYYY')}`,
      detail: daysBetween(item.fromDate, item.toDate),
      reason: item.reason || item.mailSubject || 'No reason added',
      status: item.status,
      createdAt: item.createdAt,
      icon: <EventAvailableRoundedIcon />,
    }));

    const workItems = workRequests.map((item) => ({
      id: `work-${item.id}`,
      type: 'Work',
      title: item.type.replaceAll('_', ' '),
      date: `${dayjs(item.fromDate).format('DD MMM')} - ${dayjs(item.toDate).format('DD MMM YYYY')}`,
      detail: daysBetween(item.fromDate, item.toDate),
      reason: item.reason || 'No reason added',
      status: item.status,
      createdAt: item.createdAt || item.fromDate,
      icon: <HomeWorkRoundedIcon />,
    }));

    const regularizationItems = regularizationRequests.map((item) => ({
      id: `regularization-${item.id}`,
      type: 'Correction',
      title: 'Attendance Regularization',
      date: dayjs(item.date).format('DD MMM YYYY'),
      detail: `${timeLabel(item.inTime)} to ${timeLabel(item.outTime)}`,
      reason: item.reason || 'No reason added',
      status: item.status,
      createdAt: item.createdAt,
      icon: <EditCalendarRoundedIcon />,
    }));

    const compOffItems = compOffRequests.map((item) => ({
      id: `compoff-${item.id}`,
      type: 'Comp Off',
      title: 'Comp Off Request',
      date: dayjs(item.requestedDate).format('DD MMM YYYY'),
      detail: `${Math.floor(item.overtimeMinutes / 60)}h ${item.overtimeMinutes % 60}m earned`,
      reason: item.reason || `Overtime on ${dayjs(item.overtimeDate).format('DD MMM YYYY')}`,
      status: item.status,
      createdAt: item.requestedDate,
      icon: <PaidRoundedIcon />,
    }));

    return [...leaveItems, ...workItems, ...regularizationItems, ...compOffItems]
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [leaveRequests, workRequests, regularizationRequests, compOffRequests]);

  const filters = ['All', 'Pending', 'Approved', 'Rejected'];
  const visibleRequests = requests.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Pending') return item.status === 'PENDING' || item.status === 'MANAGER_RECOMMENDED' || item.status === 'CANCELLATION_REQUESTED';
    return item.status === filter.toUpperCase();
  });

  const pendingCount = requests.filter((item) => item.status === 'PENDING' || item.status === 'MANAGER_RECOMMENDED' || item.status === 'CANCELLATION_REQUESTED').length;
  const approvedCount = requests.filter((item) => item.status === 'APPROVED').length;
  const rejectedCount = requests.filter((item) => item.status === 'REJECTED' || item.status === 'CANCELLED').length;

  const openRequestDialog = (nextMode: RequestMode = 'leave') => {
    setMode(nextMode);
    setForm(initialForm());
    setSubmitError(null);
    setAttachmentFile(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    if (initialMode) openRequestDialog(initialMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMode]);

  const submitRequest = async () => {
    if (!form.reason.trim()) {
      setSubmitError('Reason is required');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      let createdId: number | string | null = null;
      if (mode === 'leave') {
        const response = await api.post('/api/employee/leave-requests', {
          fromDate: form.fromDate,
          toDate: form.toDate,
          leaveType: form.leaveType,
          reason: form.reason.trim(),
          mailSubject: `Leave request ${form.fromDate} to ${form.toDate}`,
          mailMessage: form.reason.trim(),
        });
        createdId = response.data?.id;
      } else if (mode === 'work') {
        const response = await api.post('/api/employee/work-requests', {
          type: form.workType,
          fromDate: form.fromDate,
          toDate: form.toDate,
          reason: form.reason.trim(),
        });
        createdId = response.data?.id;
      } else if (mode === 'regularization') {
        const response = await api.post('/api/employee/regularization-requests', {
          date: form.date,
          inTime: form.inTime ? `${form.date}T${form.inTime}:00` : null,
          outTime: form.outTime ? `${form.date}T${form.outTime}:00` : null,
          reason: form.reason.trim(),
        });
        createdId = response.data?.id;
      } else {
        const response = await api.post('/api/employee/comp-off-requests', {
          overtimeDate: form.overtimeDate,
          requestedDate: form.requestedDate,
          overtimeMinutes: Number(form.overtimeMinutes),
          reason: form.reason.trim(),
        });
        createdId = response.data?.id;
      }

      if (attachmentFile && createdId) {
        const upload = new FormData();
        upload.append('file', attachmentFile);
        const uploadPath = mode === 'leave'
          ? `/api/employee/leave-requests/${createdId}/attachment`
          : mode === 'work'
            ? `/api/employee/work-requests/${createdId}/attachment`
            : mode === 'regularization'
              ? `/api/employee/regularization-requests/${createdId}/attachment`
              : `/api/employee/comp-off-requests/${createdId}/attachment`;
        await api.post(uploadPath, upload, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      await refreshRequests();
      setAttachmentFile(null);
      setDialogOpen(false);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.error || 'Request could not be submitted');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MotionBox initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }} sx={{ display: 'grid', gap: 2.5 }}>
      <Box sx={{ ...cardSx, p: { xs: 2, md: 2.5 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 2, alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: { xs: 22, md: 26 } }}>Request center</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>Track leave, work-from-home, comp-off, and attendance corrections in one place.</Typography>
        </Box>
        <Button onClick={() => openRequestDialog('leave')} variant="contained" startIcon={<AddRoundedIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 900, px: 2.25, py: 1.15 }}>
          New request
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', md: 'repeat(3, 180px)' }, gap: 1.5 }}>
        {[
          ['Pending', pendingCount, 'warning.light', 'warning.dark'],
          ['Approved', approvedCount, 'success.light', 'success.dark'],
          ['Rejected', rejectedCount, 'error.light', 'error.dark'],
        ].map(([label, value, bg, color]) => (
          <Box key={label as string} sx={{ ...cardSx, p: 1.75, bgcolor: bg as string, borderColor: bg as string }}>
            <Typography sx={{ color: color as string, fontWeight: 800, fontSize: 12 }}>{label}</Typography>
            <Typography sx={{ color: color as string, fontWeight: 900, fontSize: 26 }}>{value}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.25, '&::-webkit-scrollbar': { display: 'none' } }}>
        {filters.map((item) => (
          <Chip key={item} label={item} onClick={() => setFilter(item)} sx={{ borderRadius: '8px', fontWeight: 900, px: 0.5, bgcolor: filter === item ? 'primary.main' : 'background.paper', color: filter === item ? 'primary.contrastText' : 'text.secondary', border: '1px solid', borderColor: filter === item ? 'primary.main' : 'divider' }} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 0.25, '&::-webkit-scrollbar': { display: 'none' } }}>
        {requestModes.map((item) => (
          <Button key={item.mode} onClick={() => openRequestDialog(item.mode)} variant="outlined" size="small" sx={{ flexShrink: 0, borderRadius: '8px', borderColor: 'divider', color: 'text.primary', textTransform: 'none', fontWeight: 900 }}>
            {item.label}
          </Button>
        ))}
      </Box>

      <MotionBox initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }} sx={{ display: 'grid', gap: 1.5 }}>
        {visibleRequests.length ? visibleRequests.map((item) => {
          const tone = statusStyle(item.status);
          return (
            <MotionBox key={item.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} sx={{ ...cardSx, p: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '44px 1fr auto' }, gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ width: 44, height: 44, borderRadius: '8px', bgcolor: 'primary.light', color: 'primary.dark', display: { xs: 'none', sm: 'grid' }, placeItems: 'center' }}>{item.icon}</Box>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 900 }}>{item.title}</Typography>
                  <Chip size="small" label={item.type} sx={{ bgcolor: 'action.hover', color: 'text.secondary', borderRadius: '8px', fontWeight: 800 }} />
                </Box>
                <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700 }}>{item.date} - {item.detail}</Typography>
                <Typography sx={{ color: 'text.primary', fontSize: 13, mt: 0.75, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.reason}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Chip label={tone.label} sx={{ bgcolor: tone.bg, color: tone.color, borderRadius: '8px', fontWeight: 900 }} />
              </Box>
            </MotionBox>
          );
        }) : (
          <EmptyState 
            title="No requests found" 
            description="When you submit a request, its approval status will appear here." 
            icon={<FactCheckRoundedIcon fontSize="large" />} 
          />
        )}
      </MotionBox>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: '8px' } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>New request</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '8px !important' }}>
          <TextField select label="Request type" value={mode} onChange={(event) => setMode(event.target.value as RequestMode)} size="small">
            {requestModes.map((item) => <MenuItem key={item.mode} value={item.mode}>{item.label}</MenuItem>)}
          </TextField>

          {mode === 'leave' && (
            <>
              <TextField select label="Leave type" value={form.leaveType} onChange={(event) => setForm({ ...form, leaveType: event.target.value })} size="small">
                {['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE', 'UNPAID_LEAVE'].map((item) => <MenuItem key={item} value={item}>{item.replaceAll('_', ' ')}</MenuItem>)}
              </TextField>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField label="From" type="date" value={form.fromDate} onChange={(event) => setForm({ ...form, fromDate: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
                <TextField label="To" type="date" value={form.toDate} onChange={(event) => setForm({ ...form, toDate: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
              </Box>
            </>
          )}

          {mode === 'work' && (
            <>
              <TextField select label="Work type" value={form.workType} onChange={(event) => setForm({ ...form, workType: event.target.value })} size="small">
                <MenuItem value="WORK_FROM_HOME">WORK FROM HOME</MenuItem>
                <MenuItem value="ON_DUTY">ON DUTY</MenuItem>
              </TextField>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField label="From" type="date" value={form.fromDate} onChange={(event) => setForm({ ...form, fromDate: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
                <TextField label="To" type="date" value={form.toDate} onChange={(event) => setForm({ ...form, toDate: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
              </Box>
            </>
          )}

          {mode === 'regularization' && (
            <>
              <TextField label="Date" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField label="In time" type="time" value={form.inTime} onChange={(event) => setForm({ ...form, inTime: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
                <TextField label="Out time" type="time" value={form.outTime} onChange={(event) => setForm({ ...form, outTime: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
              </Box>
            </>
          )}

          {mode === 'compOff' && (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <TextField label="Overtime date" type="date" value={form.overtimeDate} onChange={(event) => setForm({ ...form, overtimeDate: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
                <TextField label="Off date" type="date" value={form.requestedDate} onChange={(event) => setForm({ ...form, requestedDate: event.target.value })} InputLabelProps={{ shrink: true }} size="small" />
              </Box>
              <TextField label="Overtime minutes" type="number" value={form.overtimeMinutes} onChange={(event) => setForm({ ...form, overtimeMinutes: Number(event.target.value) })} size="small" />
            </>
          )}

          <TextField label="Reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} multiline minRows={3} size="small" />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, border: '1px dashed', borderColor: 'divider', borderRadius: '8px', p: 1.25, bgcolor: 'background.default' }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, fontSize: 13 }}>Supporting document</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachmentFile ? attachmentFile.name : 'Optional PDF, image, or document proof'}</Typography>
            </Box>
            <Button component="label" size="small" variant="outlined" startIcon={<AttachFileRoundedIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 900, flexShrink: 0 }}>
              Attach
              <input hidden type="file" onChange={(event) => setAttachmentFile(event.target.files?.[0] || null)} />
            </Button>
          </Box>
          {submitError && <Alert severity="error" sx={{ borderRadius: '8px' }}>{submitError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800 }}>Cancel</Button>
          <Button onClick={submitRequest} disabled={submitting} variant="contained" sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 900 }}>
            {submitting ? 'Submitting...' : 'Submit request'}
          </Button>
        </DialogActions>
      </Dialog>
    </MotionBox>
  );
}






