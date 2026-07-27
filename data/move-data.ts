export type Task = { id: string; title: string; lane: 'todo'|'progress'|'done'; progress: number; monthStart: number; monthEnd: number; owner: 'You'|'Midori'|'Both'; area: 'housing'|'finances'|'admin'|'logistics' };
export const months = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
export const tasks: Task[] = [
  { id:'housing-1', title:'Compare relocation service vs self-search', lane:'progress', progress:55, monthStart:0, monthEnd:2, owner:'Both', area:'housing' },
  { id:'housing-2', title:'Create apartment shortlist', lane:'todo', progress:5, monthStart:1, monthEnd:3, owner:'Both', area:'housing' },
  { id:'housing-3', title:'Book viewings / attend viewings', lane:'todo', progress:0, monthStart:2, monthEnd:4, owner:'Both', area:'housing' },
  { id:'finance-1', title:'Finalize move budget', lane:'done', progress:100, monthStart:0, monthEnd:0, owner:'Both', area:'finances' },
  { id:'finance-2', title:'Track rent + deposit buffer', lane:'progress', progress:70, monthStart:0, monthEnd:7, owner:'You', area:'finances' },
  { id:'admin-1', title:'Prepare CPR / MitID checklist', lane:'todo', progress:10, monthStart:4, monthEnd:6, owner:'Both', area:'admin' },
  { id:'log-1', title:'Compare moving companies', lane:'todo', progress:0, monthStart:2, monthEnd:4, owner:'Both', area:'logistics' },
  { id:'log-2', title:'Storage decision for furniture', lane:'todo', progress:0, monthStart:4, monthEnd:5, owner:'Both', area:'logistics' },
];
