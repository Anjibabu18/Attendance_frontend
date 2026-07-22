import { Box, Typography, Card, CardContent } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import AppCard from './AppCard';

export default function AnalyticsDashboard({ analytics }: { analytics: any }) {
  if (!analytics) return null;

  // Format check-in trend data for charts
  const checkInTrendData = Object.entries(analytics.checkInTrend || {}).map(([date, count]) => ({
    date: date.substring(5), // MM-DD
    count: count as number,
  }));

  // Format department rate for charts
  const deptRateData = Object.entries(analytics.departmentRate || {}).map(([dept, rate]) => ({
    dept,
    rate: rate as number,
  }));

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      {/* Overview Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3 }}>
        <StatCard title="Total Employees" value={analytics.employees} icon="👥" color="#3b82f6" />
        <StatCard title="Present Today" value={analytics.todayPresent} icon="✅" color="#22c55e" />
        <StatCard title="On Leave" value={analytics.leaveEntries} icon="🏖️" color="#eab308" />
        <StatCard title="Late Minutes" value={analytics.lateMinutes} icon="⏰" color="#ef4444" />
      </Box>

      {/* Charts Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        
        {/* Check-in Trend Area Chart */}
        <AppCard>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Monthly Check-in Trend</Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            {checkInTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={checkInTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="count" name="Check-ins" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available for this month</Typography>
              </Box>
            )}
          </Box>
        </AppCard>

        {/* Department Rate Bar Chart */}
        <AppCard>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 3 }}>Department Attendance Rate</Typography>
          <Box sx={{ height: 300, width: '100%' }}>
            {deptRateData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptRateData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="dept" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 700, fill: '#334155' }} width={90} />
                  <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [`${value}%`, 'Rate']} />
                  <Bar dataKey="rate" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">No data available</Typography>
              </Box>
            )}
          </Box>
        </AppCard>

      </Box>

      {/* Leaderboards Row */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        
        {/* Top Late Employees */}
        <AppCard>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Top Late Employees</Typography>
          {analytics.topLateEmployees?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {analytics.topLateEmployees.map((emp: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{emp.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#64748b' }}>{emp.dept}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 900, color: '#ef4444' }}>{emp.lateMinutes}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Mins Late</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
             <Typography color="text.secondary" sx={{ py: 2 }}>No late employees found.</Typography>
          )}
        </AppCard>

        {/* Top Absent Employees */}
        <AppCard>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>Top Absent Employees</Typography>
          {analytics.topAbsentEmployees?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {analytics.topAbsentEmployees.map((emp: any, i: number) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{emp.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#64748b' }}>{emp.dept}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontWeight: 900, color: '#f97316' }}>{emp.absentDays}</Typography>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Days Absent</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ py: 2 }}>No absent employees found.</Typography>
          )}
        </AppCard>

      </Box>
    </Box>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: string, color: string }) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', border: '1px solid #f1f5f9' }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography sx={{ color: '#64748b', fontSize: 13, fontWeight: 700, mb: 0.5 }}>{title}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{value || 0}</Typography>
          </Box>
          <Box sx={{ bgcolor: `${color}15`, width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
