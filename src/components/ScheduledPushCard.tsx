
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, Checkbox, FormGroup, CircularProgress } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ScheduleSendRoundedIcon from '@mui/icons-material/ScheduleSendRounded';
import { api } from '../api/client';
import { useToast } from './Toast';

interface ScheduledPush {
  id: number;
  title: string;
  body: string;
  cronExpression: string;
  isActive: boolean;
  createdAt: string;
}

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

function timeAndDaysToCron(time: string, days: number[]) {
  const [hour, minute] = time.split(':');
  const dayStr = days.length > 0 ? days.join(',') : '*';
  return `${Number(minute)} ${Number(hour)} * * ${dayStr}`;
}

function cronToTimeAndDays(cron: string) {
  const parts = cron.split(' ');
  const minute = parts[0] === '*' ? '00' : parts[0].padStart(2, '0');
  const hour = parts[1] === '*' ? '00' : parts[1].padStart(2, '0');
  const time = `${hour}:${minute}`;
  const days = parts[4] === '*' ? DAYS.map(d => d.value) : parts[4].split(',').map(Number);
  return { time, days };
}

export default function ScheduledPushCard() {
  const { toastSuccess, toastError } = useToast();
  const [pushes, setPushes] = useState<ScheduledPush[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [time, setTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);

  const fetchPushes = async () => {
    try {
      const res = await api.get('/api/admin/scheduled-pushes');
      setPushes(res.data);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch scheduled pushes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPushes();
  }, []);

  const handleOpenNew = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setTime('09:00');
    setSelectedDays([1,2,3,4,5]); // Mon-Fri default
    setIsActive(true);
    setDialogOpen(true);
  };

  const handleOpenEdit = (push: ScheduledPush) => {
    setEditingId(push.id);
    setTitle(push.title);
    setBody(push.body);
    setIsActive(push.isActive);
    try {
      const { time: t, days } = cronToTimeAndDays(push.cronExpression);
      setTime(t);
      setSelectedDays(days);
    } catch {
      setTime('09:00');
      setSelectedDays([]);
    }
    setDialogOpen(true);
  };

  const handleToggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !body.trim() || !time) {
      return toastError('Please fill in title, body, and time');
    }
    setSaving(true);
    try {
      const cronExpression = timeAndDaysToCron(time, selectedDays);
      const payload = { title, body, cronExpression, isActive };
      if (editingId) {
        await api.put(`/api/admin/scheduled-pushes/${editingId}`, payload);
        toastSuccess('Scheduled push updated');
      } else {
        await api.post('/api/admin/scheduled-pushes', payload);
        toastSuccess('Scheduled push created');
      }
      setDialogOpen(false);
      fetchPushes();
    } catch (err: any) {
      toastError(err.message || 'Failed to save scheduled push');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (push: ScheduledPush) => {
    try {
      await api.put(`/api/admin/scheduled-pushes/${push.id}`, { isActive: !push.isActive });
      fetchPushes();
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle active status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this scheduled push?')) return;
    try {
      await api.delete(`/api/admin/scheduled-pushes/${id}`);
      toastSuccess('Scheduled push deleted');
      fetchPushes();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete scheduled push');
    }
  };

  return (
    <Box sx={{ mt: 3, bgcolor: 'white', p: 3, borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScheduleSendRoundedIcon />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0F172A' }}>Scheduled Pushes</Typography>
            <Typography sx={{ color: '#64748B', fontSize: 13 }}>Automate notifications via cron jobs</Typography>
          </Box>
        </Box>
        <Button variant="contained" onClick={handleOpenNew} startIcon={<AddRoundedIcon />} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, boxShadow: 'none' }}>
          Add New
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : pushes.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1' }}>
          <Typography sx={{ color: '#64748B', fontSize: 14 }}>No scheduled pushes found.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {pushes.map(push => {
            let readableTime = '';
            try {
              const { time, days } = cronToTimeAndDays(push.cronExpression);
              const dayLabels = days.map(d => DAYS.find(x => x.value === d)?.label).join(', ');
              readableTime = `${time} on ${dayLabels || 'All days'}`;
            } catch {
              readableTime = push.cronExpression;
            }
            
            return (
              <Box key={push.id} sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: push.isActive ? '#fff' : '#F8FAFC' }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#1E293B', mb: 0.5 }}>{push.title}</Typography>
                  <Typography sx={{ color: '#64748B', fontSize: 14, mb: 1 }}>{push.body}</Typography>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1.5, py: 0.5, bgcolor: '#F1F5F9', borderRadius: '6px', fontSize: 12, fontWeight: 600, color: '#475569', gap: 0.5 }}>
                    <ScheduleSendRoundedIcon sx={{ fontSize: 14 }} /> {readableTime}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControlLabel
                    control={<Switch size="small" checked={push.isActive} onChange={() => handleToggleActive(push)} />}
                    label={<Typography sx={{ fontSize: 12, fontWeight: 600, color: push.isActive ? '#10B981' : '#94A3B8' }}>{push.isActive ? 'Active' : 'Inactive'}</Typography>}
                    labelPlacement="start"
                    sx={{ mr: 2 }}
                  />
                  <IconButton onClick={() => handleOpenEdit(push)} size="small" sx={{ color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.1)', '&:hover': { bgcolor: 'rgba(59,130,246,0.2)' } }}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(push.id)} size="small" sx={{ color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)', '&:hover': { bgcolor: 'rgba(239,68,68,0.2)' } }}>
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingId ? 'Edit Scheduled Push' : 'New Scheduled Push'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 3, pt: 1 }}>
            <TextField fullWidth label="Notification Title" value={title} onChange={(e) => setTitle(e.target.value)} variant="outlined" InputLabelProps={{ shrink: true }} placeholder="e.g. Daily Standup Reminder" />
            <TextField fullWidth label="Notification Body" value={body} onChange={(e) => setBody(e.target.value)} variant="outlined" InputLabelProps={{ shrink: true }} multiline rows={2} placeholder="e.g. Please join the daily standup meeting in 5 minutes." />
            
            <Box sx={{ display: 'flex', gap: 3 }}>
              <TextField 
                type="time" 
                label="Time" 
                value={time} 
                onChange={(e) => setTime(e.target.value)} 
                InputLabelProps={{ shrink: true }} 
                sx={{ width: 150 }}
              />
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
                label="Active"
              />
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>Repeat on Days</Typography>
              <FormGroup row>
                {DAYS.map(day => (
                  <FormControlLabel
                    key={day.value}
                    control={<Checkbox size="small" checked={selectedDays.includes(day.value)} onChange={() => handleToggleDay(day.value)} />}
                    label={<Typography sx={{ fontSize: 13 }}>{day.label}</Typography>}
                    sx={{ mr: 1 }}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ borderRadius: '8px', fontWeight: 700, boxShadow: 'none' }}>
            {saving ? 'Saving...' : 'Save Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
