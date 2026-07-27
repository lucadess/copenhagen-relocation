import { cn } from '@/lib/utils';
export function Tabs({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={className} {...props} />; }
export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn('inline-flex rounded-xl bg-slate-100 p-1', className)} {...props} />; }
export function TabsTrigger({ className, active, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) { return <button className={cn('rounded-lg px-3 py-1.5 text-sm', active ? 'bg-white shadow-sm' : 'text-slate-600', className)} {...props} />; }
