'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from 'recharts';
import { Plane, House, PiggyBank, FileCheck2, Truck, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { months, tasks } from '@/data/move-data';

const financeData = [
  { name: 'Savings', value: 25000 },
  { name: 'Move', value: 5000 },
  { name: 'Fees', value: 10000 },
  { name: 'Buffer', value: 10000 },
];

const progressData = months.map((m, i) => ({ month: m, progress: [15, 25, 35, 45, 55, 65, 72, 80][i] }));

const areas = [
  { key: 'housing', label: 'Housing', icon: House },
  { key: 'finances', label: 'Finances', icon: PiggyBank },
  { key: 'admin', label: 'Admin', icon: FileCheck2 },
  { key: 'logistics', label: 'Logistics', icon: Truck },
] as const;

export default function DashboardApp() {
  const [tab, setTab] = useState<'overview'|'housing'|'finances'|'admin'|'logistics'>('overview');
  const selectedTasks = useMemo(() => tab === 'overview' ? tasks : tasks.filter(t => t.area === tab), [tab]);
  return <div className="min-h-screen bg-slate-50 p-4 md:p-8"><div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-tight">Copenhagen Move Dashboard</h1><p className="text-slate-600">Interactive planning for Luca & Midori</p></div><div className="flex flex-wrap gap-2">{['overview','housing','finances','admin','logistics'].map(x => <Button key={x} onClick={() => setTab(x as any)} className={tab===x ? 'bg-slate-900 text-white hover:bg-slate-800' : ''}>{x}</Button>)}</div></div>

  <div className="grid gap-4 md:grid-cols-4"><Card><CardContent className="pt-5"><div className="text-sm text-slate-500">Target move</div><div className="mt-2 text-2xl font-semibold">Jan 2027</div></CardContent></Card><Card><CardContent className="pt-5"><div className="text-sm text-slate-500">Savings goal</div><div className="mt-2 text-2xl font-semibold">€25,000+</div></CardContent></Card><Card><CardContent className="pt-5"><div className="text-sm text-slate-500">Priority</div><div className="mt-2 text-2xl font-semibold">Housing</div></CardContent></Card><Card><CardContent className="pt-5"><div className="text-sm text-slate-500">Readiness</div><div className="mt-2 text-2xl font-semibold">72%</div></CardContent></Card></div>

  <div className="grid gap-6 lg:grid-cols-3">
    <Card className="lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Gantt timeline</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><div className="min-w-[900px] space-y-3">{[['Planning',0,0],['Housing search',1,4],['Midori job search',2,6],['Move logistics',3,5],['Admin setup',5,7]].map(([label,s,e]) => <div key={label as string} className="grid grid-cols-[180px_repeat(8,minmax(0,1fr))] gap-2 items-center text-sm"><div className="font-medium">{label as string}</div>{months.map((_, i) => <div key={i} className={i >= (s as number) && i <= (e as number) ? 'h-7 rounded-full bg-slate-900' : 'h-7 rounded-full bg-slate-100'} />)}</div>)}</div></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><House className="h-5 w-5" /> Month focus</CardTitle></CardHeader><CardContent className="space-y-3">{selectedTasks.map(t => <motion.div key={t.id} whileHover={{ y: -2 }} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex items-start justify-between gap-3"><div className="font-medium">{t.title}</div><Badge>{t.owner}</Badge></div><div className="mt-2 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900" style={{ width: `${t.progress}%` }} /></div></motion.div>)}</CardContent></Card>
  </div>

  <div className="grid gap-6 lg:grid-cols-2">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="h-5 w-5" /> Budget</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={financeData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="#0f172a" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5" /> Readiness</CardTitle></CardHeader><CardContent className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={progressData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="progress" stroke="#0f172a" strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></CardContent></Card>
  </div>
</div></div>;
}
