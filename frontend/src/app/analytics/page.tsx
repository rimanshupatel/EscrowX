'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Users, Clock, CheckCircle, Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/shared/StatCard';
import { MOCK_ANALYTICS } from '@/lib/mock-data';
import { truncateAddress, formatXLM } from '@/lib/utils';

const DATE_RANGES = ['7D', '30D', '90D', '1Y', 'All'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('90D');

  return (
    <AppLayout title="Analytics">
      <div className="space-y-6">
        {/* Date range + header row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#9CA3AF]">Showing data for your escrow activity</p>
          <div className="flex items-center gap-1 bg-[#F8F9FB] rounded-[10px] border border-[#E4E8F0] p-1">
            <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] mx-2" />
            {DATE_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-[7px] text-xs font-semibold transition-all ${
                  dateRange === range
                    ? 'bg-white text-[#5B6BF8] shadow-sm'
                    : 'text-[#9CA3AF] hover:text-[#6B7280]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard
            label="Total Volume"
            value={`${formatXLM(MOCK_ANALYTICS.kpis.totalVolume)} XLM`}
            subValue="≈ $10,953.60"
            trend={{ value: '+18% vs last period', direction: 'up' }}
            icon={<TrendingUp className="w-4 h-4" />}
            accent="brand"
            delay={0}
          />
          <StatCard
            label="Success Rate"
            value={`${MOCK_ANALYTICS.kpis.successRate}%`}
            subValue="Approved without dispute"
            trend={{ value: '+2.1% improvement', direction: 'up' }}
            icon={<CheckCircle className="w-4 h-4" />}
            accent="success"
            delay={0.08}
          />
          <StatCard
            label="Avg Completion"
            value={`${MOCK_ANALYTICS.kpis.avgCompletionDays} days`}
            subValue="From creation to release"
            trend={{ value: '-1.2 days vs avg', direction: 'up' }}
            icon={<Clock className="w-4 h-4" />}
            accent="default"
            delay={0.16}
          />
          <StatCard
            label="Active Users"
            value={`${MOCK_ANALYTICS.kpis.activeUsers}`}
            subValue="Buyers & sellers"
            trend={{ value: '+24 this month', direction: 'up' }}
            icon={<Users className="w-4 h-4" />}
            accent="brand"
            delay={0.24}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid xl:grid-cols-3 gap-6">
          {/* Line chart — Volume over time */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="xl:col-span-2 bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[16px] font-bold text-[#0F1117]">Escrow Volume</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">XLM locked in escrow over time</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-[#9CA3AF]">
                  <span className="w-3 h-0.5 bg-[#5B6BF8] inline-block rounded" />
                  Volume (XLM)
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={MOCK_ANALYTICS.volumeOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F8" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v.toLocaleString()}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E4E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'Inter',
                    boxShadow: '0 4px 16px rgba(91,107,248,0.12)',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} XLM`, 'Volume']}
                />
                <Line
                  type="monotone"
                  dataKey="volume"
                  stroke="#5B6BF8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#5B6BF8', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 5, fill: '#5B6BF8', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Donut chart — Category */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-6"
          >
            <div className="mb-4">
              <h3 className="text-[16px] font-bold text-[#0F1117]">By Category</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Escrow distribution by type</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={MOCK_ANALYTICS.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {MOCK_ANALYTICS.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E4E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'Inter',
                  }}
                  formatter={(value) => [`${value}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {MOCK_ANALYTICS.categoryBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-[#6B7280]">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-[#0F1117]">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Charts row 2 */}
        <div className="grid xl:grid-cols-2 gap-6">
          {/* Bar chart — Outcomes */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] p-6"
          >
            <div className="mb-6">
              <h3 className="text-[16px] font-bold text-[#0F1117]">Escrow Outcomes</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Approved vs Disputed vs Refunded</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MOCK_ANALYTICS.outcomeBreakdown} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F2F4F8" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E4E8F0',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontFamily: 'Inter',
                  }}
                  formatter={(value) => [`${value}%`, 'Share']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {MOCK_ANALYTICS.outcomeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top sellers table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="bg-white rounded-[16px] border border-[#E4E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_32px_rgba(91,107,248,0.08)] overflow-hidden"
          >
            <div className="p-5 border-b border-[#E4E8F0]">
              <h3 className="text-[16px] font-bold text-[#0F1117]">Top Sellers</h3>
              <p className="text-xs text-[#9CA3AF] mt-0.5">By completed escrows</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E4E8F0]">
                    {['Seller', 'Completed', 'Volume', 'Success'].map((col) => (
                      <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9CA3AF]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_ANALYTICS.topSellers.map((seller, i) => (
                    <tr key={seller.address} className="border-b border-[#F2F4F8] hover:bg-[#F8F9FB] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[10px] font-bold text-[#5B6BF8]">
                            {i + 1}
                          </div>
                          <span className="font-mono text-xs text-[#6B7280]">
                            {truncateAddress(seller.address, 6)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-[#0F1117]">{seller.completedEscrows}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-[#0F1117]">
                          {seller.totalVolume.toLocaleString()} XLM
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#F2F4F8] rounded-full max-w-16">
                            <div
                              className="h-1.5 rounded-full bg-[#16A865]"
                              style={{ width: `${seller.successRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#16A865]">{seller.successRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
