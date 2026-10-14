const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Icon = {
  plus: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M12 5v14M5 12h14" /></svg>,
  dashboard: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  team: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c.6-3.4 3-5.4 6-5.4s5.4 2 6 5.4" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.6c2.6.2 4.4 2 5 4.9" /></svg>,
  calendar: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><rect x="3" y="5" width="18" height="16" rx="2.5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>,
  outputs: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4M4 17l8 4 8-4" /></svg>,
  convo: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><path d="M4 5h16v10H9l-5 4V5z" /></svg>,
  memory: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></svg>,
  inbox: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><path d="M6 17V11a6 6 0 1112 0v6l1.5 2h-15L6 17z" /><path d="M10 21h4" /></svg>,
  settings: <svg width="17" height="17" viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z" /></svg>,
  terminal: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M7 9l3 3-3 3M12 15h5" /></svg>,
  pause: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M9 5v14M15 5v14" /></svg>,
  play: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M7 5l12 7-12 7V5z" /></svg>,
  board: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M9 4v16M15 4v16" /></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><path d="M4 5h16v10H9l-5 4V5z" /><path d="M8 9h8M8 12h5" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>,
  back: <svg width="15" height="15" viewBox="0 0 24 24" {...P}><path d="M10 6l-6 6 6 6M4 12h16" /></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" {...P}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>,
};
