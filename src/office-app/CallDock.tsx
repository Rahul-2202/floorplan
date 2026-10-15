"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RuntimeBadge } from "@/components/ui";
import { speechSupported, useMeeting, type Line } from "@/lib/meeting";
import { useSpeech } from "@/lib/useSpeech";
import { Portrait } from "@/office/Avatar";
import { CAST, spot } from "@/office/layout";
import { relayCmd, relayLine, toWire } from "@/live/LiveSync";
import { ensureLocal, localStream, peersOf, setMic as setMicTrack, stopLocal, streamTo } from "@/live/net";
import { getLive, onLive, setLive, useLive } from "@/live/state";
import { agentChime, agentRoom, mentions, personReply } from "@/sim/people";
import { roomName, useSim, type SimState } from "@/sim/store";
import { Face } from "./bits";
import { Icon } from "./icons";
import { useUI } from "./ui";
import { nameOf, roomAt } from "./who";

/** People standing in a room right now (from where they are, not their team). */
export function peopleIn(s: SimState, room: string | null) {
  if (!room) return [];
  return Object.keys(s.people).filter((id) => {
    if (id === s.me) return false;
    const at = s.live[id]?.at;
    if (!at) return false;
    const [x, y] = spot(at);
    return roomAt(x, y) === room;
  });
}

const OPENERS: Record<string, Line[]> = {
  dev: [
    { who: "priya", text: "Hey, welcome in! We're going through the release checklist." },
    { who: "sam", text: "Six of eight done. DNS and the last regression run are left." },
    { who: "priya", text: "Want me to pull the PM in for the details? Just add it to the call." },
  ],
  marketing: [
    { who: "marco", text: "Hi! We're picking the visuals for the launch posts." },
    { who: "lena", text: "Option B tested better with clinic owners, so I'd go with that." },
    { who: "marco", text: "Let's get the Strategist's view. Add it to the call?" },
  ],
};

const AGENT_HELLO: Record<string, string> = {
  pm: "Hi all. The checklist is six of eight. The Tester's last regression run finishes in about twenty minutes, and DNS is the only real blocker.",
  strat: "Option B, agreed. It matches the voice guide, and the Editor has already cleared the copy.",
  ada: "I'm here. I'll take notes and put any decisions in the minutes.",
};

interface Entry {
  id: number;
  who: string;
  text: string;
  /** Index in the voice queue; unset for your own lines (shown at once). */
  vi?: number;
}

/** Is anyone talking on this stream? A small level meter. */
function useLevel(stream: MediaStream | null | undefined, ver: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!stream || !stream.getAudioTracks().length) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC();
    const an = ac.createAnalyser();
    an.fftSize = 512;
    ac.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.frequencyBinCount);
    const t = setInterval(() => {
      an.getByteTimeDomainData(buf);
      let m = 0;
      for (const v of buf) m = Math.max(m, Math.abs(v - 128));
      setOn(m > 10);
    }, 160);
    return () => {
      clearInterval(t);
      setOn(false);
      void ac.close();
    };
  }, [stream, ver]);
  return on;
}

const liveVideo = (st?: MediaStream | null) => !!st?.getVideoTracks().some((t) => t.readyState === "live" && !t.muted && t.enabled);

function Tile({ id, speaking, agent, video, stream, muted, screen, remote, ver = 0, mirror = true }: { id: string; speaking: boolean; agent?: boolean; video?: boolean; stream?: MediaStream | null; muted?: boolean; screen?: boolean; remote?: MediaStream | null; ver?: number; mirror?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const aud = useRef<HTMLAudioElement>(null);
  const src = remote ?? stream;
  const showVideo = remote ? liveVideo(remote) : video && !!stream;
  const talking = useLevel(remote ?? (muted ? null : stream), ver);
  speaking = speaking || talking;
  useEffect(() => {
    if (ref.current && src && ref.current.srcObject !== src) ref.current.srcObject = src;
    if (aud.current && remote && aud.current.srcObject !== remote) aud.current.srcObject = remote;
  }, [src, remote, showVideo, ver]);
  const look = CAST[id]?.look;
  const tint = agent ? "linear-gradient(160deg,#3a2a22,#1d1714)" : id === "ada" ? "linear-gradient(160deg,#5a3320,#2a1a12)" : "linear-gradient(160deg,#25335e,#141a2e)";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative h-[92px] w-[132px] shrink-0 overflow-hidden rounded-[14px] ring-2 transition-shadow ${speaking ? "ring-[#5fd08a] shadow-[0_0_0_4px_rgba(95,208,138,0.25)]" : "ring-white/10"}`}
      style={{ background: tint }}
    >
      {screen ? (
        <div className="absolute inset-0 grid place-items-center bg-[#0f1115] p-2">
          <div className="h-full w-full rounded-[6px] bg-[linear-gradient(180deg,#f6f5f2,#e9e6df)] p-1.5">
            <div className="mb-1 h-1.5 w-10 rounded bg-black/20" />
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 rounded-[3px] bg-white ring-1 ring-black/10" />
              ))}
            </div>
          </div>
        </div>
      ) : showVideo ? (
        <video ref={ref} autoPlay muted playsInline className={`absolute inset-0 h-full w-full object-cover ${mirror && !remote ? "-scale-x-100" : ""}`} />
      ) : look ? (
        <div className="absolute inset-0 grid place-items-center">
          <motion.div animate={speaking ? { y: [0, -2, 0] } : { y: 0 }} transition={{ duration: 0.5, repeat: speaking ? Infinity : 0 }}>
            <Portrait look={look} size={56} bg="transparent" />
          </motion.div>
        </div>
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <Face id={id} size={52} />
        </div>
      )}
      <div className="absolute inset-x-1.5 bottom-1.5 flex items-center gap-1">
        <span className="truncate rounded-full bg-black/55 px-1.5 py-[1px] text-[10.5px] font-semibold text-white backdrop-blur">
          {screen ? "Your screen" : nameOf(id)}
        </span>
        {agent && <span className="rounded-full bg-[#e8743b] px-1.5 py-[1px] text-[9px] font-bold uppercase text-white">Agent</span>}
        {remote !== undefined && <span className="rounded-full bg-[#ff5a4f] px-1.5 py-[1px] text-[9px] font-bold uppercase text-white">{remote ? "Live" : "No audio yet"}</span>}
        {muted && <span className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-black/55 text-white [&>svg]:h-2.5 [&>svg]:w-2.5">{Icon.micOff}</span>}
      </div>
      {remote && <audio ref={aud} autoPlay />}
      {speaking && (
        <div className="absolute right-1.5 top-1.5 flex items-end gap-[2px]">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} className="w-[3px] rounded-full bg-[#5fd08a]" animate={{ height: [4, 10, 5, 9, 4] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12 }} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function Call({ k }: { k: string }) {
  const { s, d } = useSim();
  const ui = useUI();
  const call = s.calls[k];
  const room = k.startsWith("p2p:") ? null : k;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [voice, setVoice] = useState<Line[]>([]);
  const [sound, setSound] = useState(false);
  const [cam, setCam] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [screen, setScreen] = useState(false);
  const live = useLive();
  const realIds = call.people.filter((p) => p !== s.me && s.people[p]?.real);
  const realKey = realIds.join(",");
  const withReal = live.status !== "off" && realIds.length > 0;
  const [mic, setMic] = useState(() => getLive().status !== "off" && realIds.length > 0);
  const [localVer, setLocalVer] = useState(0);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [captions, setCaptions] = useState(true);
  const seq = useRef(0);
  const sRef = useRef(s);
  useLayoutEffect(() => {
    sRef.current = s;
  });
  const { index, speaking } = useMeeting(voice, "live", sound);
  const speaker = speaking || (!sound && index >= 0 && index < voice.length) ? voice[index]?.who : null;

  const voiceLen = useRef(0);
  const queue = (lines: Line[], relay = true) => {
    const start = voiceLen.current;
    voiceLen.current += lines.length;
    const add = lines.map((l, i) => ({ id: ++seq.current, who: l.who, text: l.text, vi: start + i }));
    setVoice((v) => [...v, ...lines]);
    setEntries((e) => [...e, ...add]);
    // Real people in the call hear the same agents.
    if (relay) lines.forEach((l) => relayLine(sRef.current, k, l.who, l.text, true));
  };
  const queueRef = useRef(queue);
  useLayoutEffect(() => {
    queueRef.current = queue;
  });

  // Lines from real people's side of the call.
  useEffect(
    () =>
      onLive("line", (e) => {
        if (e.call !== k) return;
        if (e.voice) queueRef.current([{ who: e.who, text: e.text }], false);
        else setEntries((x) => [...x, { id: ++seq.current, who: e.who, text: e.text }]);
      }),
    [k],
  );

  // Real voice and video: your mic (and camera) go to the real people in this call.
  useEffect(() => {
    if (live.status === "off" || !realKey) return;
    let alive = true;
    ensureLocal(cam)
      .then(() => {
        if (!alive) return;
        streamTo(peersOf(realKey.split(",")));
        setLocalVer((v) => v + 1);
      })
      .catch(() => setCamErr("Camera unavailable. Showing your avatar."));
    return () => {
      alive = false;
    };
  }, [live.status, realKey, cam]);
  useEffect(() => {
    setMicTrack(mic);
    setLive({ mic, cam });
  }, [mic, cam, localVer]);
  useEffect(() => () => stopLocal(), []);

  // The room says hello when you join.
  const greeted = useRef(false);
  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    const others = call.people.filter((p) => p !== s.me);
    const opener = room ? OPENERS[room]?.filter((l) => others.includes(l.who)) : undefined;
    const t = setTimeout(() => {
      const sim = others.filter((p) => !sRef.current.people[p]?.real);
      if (opener?.length) queue(opener, false);
      else if (sim[0]) queue([{ who: sim[0], text: personReply(sim[0], "hi", sRef.current) }], false);
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAgent = (a: string) => {
    setAdding(false);
    if (call.agents.includes(a)) return;
    d({ type: "callAgent", room: k, agent: a, on: true });
    relayCmd(s, { type: "agent", call: toWire(s, k)!, agent: a, on: true }, realIds);
    setTimeout(() => queue([{ who: a, text: AGENT_HELLO[a] ?? agentChime(a, "what are you working on", sRef.current) }]), 700);
  };

  const respond = (body: string) => {
    setEntries((e) => [...e, { id: ++seq.current, who: s.me, text: body }]);
    relayLine(s, k, s.me, body, false);
    const ms = mentions(body);
    const named = Object.keys(CAST).filter((id) => !s.people[id] && new RegExp(`\\b${CAST[id].name}\\b`, "i").test(body) && call.agents.includes(id));
    const agents = [...new Set([...ms, ...named])];
    if (agents.length && s.org.agentsInCalls) {
      agents.forEach((a) => {
        if (call.agents.includes(a)) return;
        d({ type: "callAgent", room: k, agent: a, on: true });
        relayCmd(s, { type: "agent", call: toWire(s, k)!, agent: a, on: true }, realIds);
      });
      setTimeout(() => queue(agents.map((a) => ({ who: a, text: agentChime(a, body, sRef.current) }))), 500);
      return;
    }
    const other = call.people.find((p) => p !== s.me && !s.people[p]?.real);
    if (other && !withReal) setTimeout(() => queue([{ who: other, text: personReply(other, body, sRef.current) }]), 500);
  };

  const talk = useSpeech((t) => respond(t));
  const { listening, error: micErr, start: listen, stop: unlisten } = talk;
  // Unmuted: keep listening, one sentence at a time.
  useEffect(() => {
    if (mic && !listening && !micErr) {
      const t = setTimeout(listen, 250);
      return () => clearTimeout(t);
    }
    if (!mic && listening) unlisten();
  }, [mic, listening, micErr, listen, unlisten]);

  const toggleCam = async () => {
    if (withReal) {
      setCam((v) => !v);
      return;
    }
    if (cam) {
      stream?.getTracks().forEach((t) => t.stop());
      setStream(null);
      setCam(false);
      return;
    }
    setCam(true);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 }, audio: false });
      setStream(st);
      setCamErr(null);
    } catch {
      setCamErr("Camera unavailable. Showing your avatar.");
    }
  };
  useEffect(() => () => stream?.getTracks().forEach((t) => t.stop()), [stream]);

  const leave = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stopLocal();
    setLive({ cam: false, mic: false });
    if (speechSupported()) window.speechSynthesis.cancel();
    d({ type: "leaveCall", room: k, id: s.me });
    // A 1:1 call with a simulated person ends for both; real people leave themselves.
    if (!room) call.people.filter((p) => p !== s.me && !s.people[p]?.real).forEach((p) => d({ type: "leaveCall", room: k, id: p }));
  };

  const shown = entries.filter((e) => e.vi === undefined || e.vi <= index).slice(-3);
  const roomAgents = room === "dev" || room === "marketing" ? [s.rooms[room].head, ...s.rooms[room].members] : [];
  const pick = [...new Set([...roomAgents, "ada", "pm", "strat"])].filter((a) => !call.agents.includes(a));

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      data-tour="call"
      className="pointer-events-auto flex w-[min(452px,calc(100vw-24px))] flex-col gap-2 rounded-[22px] bg-[#16151a]/95 p-2.5 text-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3 px-1.5">
        <div className="flex items-center gap-2 text-[12.5px]">
          <span className="h-2 w-2 rounded-full bg-[#ff5a4f]" style={{ animation: "led 1.4s steps(2) infinite" }} />
          <span className="font-semibold">{!room && call.people.length > 1 ? `${call.people.filter((p) => p !== s.me).map(nameOf).join(", ")} and you` : call.topic}</span>
          <span className="text-white/50">
            · {room ? roomName(room) : "Direct call"} · {call.people.length + call.agents.length} in call{withReal ? " · real audio" : ""}
          </span>
        </div>
        <button onClick={() => setCaptions((v) => !v)} className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white/60 hover:bg-white/10">
          {captions ? "Hide captions" : "Captions"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 pb-0.5">
        <AnimatePresence>
          <Tile key="me" id={s.me} speaking={talk.listening && !!talk.interim} video={cam} stream={withReal ? localStream() : stream} muted={!mic} ver={localVer} />
          {screen && <Tile key="screen" id={s.me} speaking={false} screen />}
          {call.people
            .filter((p) => p !== s.me)
            .map((p) => (s.people[p]?.real ? <Tile key={p} id={p} speaking={false} remote={live.streams[p] ?? null} ver={live.ver} /> : <Tile key={p} id={p} speaking={speaker === p} />))}
          {!room && call.people.length < 2 && (
            <div key="ringing" className="grid h-[92px] w-[132px] place-items-center rounded-[14px] bg-white/5 text-[11.5px] text-white/60 ring-1 ring-white/10">
              Ringing…
            </div>
          )}
          {call.agents.map((a) => (
            <Tile key={a} id={a} agent speaking={speaker === a} />
          ))}
        </AnimatePresence>
      </div>

      {captions && (shown.length > 0 || talk.interim) && (
        <div className="flex flex-col gap-1 rounded-[14px] bg-white/[0.06] px-3 py-2">
          {shown.map((e) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[12.5px] leading-snug">
              <span className={`font-semibold ${s.people[e.who] ? "text-[#a9bdf5]" : "text-[#f6b48c]"}`}>{nameOf(e.who)}:</span> <span className="text-white/85">{e.text}</span>
            </motion.div>
          ))}
          {talk.interim && (
            <div className="text-[12.5px] italic text-white/60">
              <span className="font-semibold not-italic text-[#a9bdf5]">You:</span> {talk.interim}…
            </div>
          )}
        </div>
      )}
      {(camErr || talk.error) && <div className="px-1.5 text-[11.5px] text-[#f6b48c]">{camErr ?? talk.error}</div>}

      <div className="flex flex-wrap items-center gap-1.5">
        <CtlBtn on={mic} onClick={() => setMic((v) => !v)} title={withReal ? "Your microphone (people in the call hear you)" : talk.supported ? "Talk: your words go to the call" : "Speech isn't supported in this browser"}>
          {mic ? Icon.mic : Icon.micOff}
        </CtlBtn>
        <CtlBtn on={cam} onClick={toggleCam} title="Camera">
          {cam ? Icon.video : Icon.videoOff}
        </CtlBtn>
        <CtlBtn on={screen} onClick={() => setScreen((v) => !v)} title="Share screen">
          {Icon.screen}
        </CtlBtn>
        <CtlBtn on={sound} onClick={() => setSound((v) => !v)} title="Hear voices">
          <span className="text-[13px]">{sound ? "🔊" : "🔈"}</span>
        </CtlBtn>
        <div className="relative">
          <button
            disabled={!s.org.agentsInCalls}
            title={s.org.agentsInCalls ? undefined : "Agents in calls is turned off in People → Hierarchy"}
            onClick={() => setAdding((v) => !v)}
            className="flex h-9 items-center gap-1.5 rounded-full bg-[#e8743b] px-3 text-[12.5px] font-semibold text-white hover:brightness-105 disabled:opacity-40"
          >
            {Icon.plus} Add an agent
          </button>
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-11 z-10 max-h-[260px] w-[230px] overflow-y-auto rounded-[16px] bg-white p-1.5 text-ink shadow-[var(--shadow-float)]">
                {pick.map((a) => (
                  <button key={a} onClick={() => addAgent(a)} className="flex w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left hover:bg-[#f6f5f2]">
                    <Face id={a} size={24} />
                    <span className="flex-1 text-[12.5px] font-semibold">{nameOf(a)}</span>
                    <span className="text-[10.5px] text-muted">{agentRoom(a) ? roomName(agentRoom(a)) : "Office"}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <form
          className="flex min-w-[180px] flex-1 gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            const body = text.trim();
            if (!body) return;
            setText("");
            respond(body);
          }}
        >
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Say something… (@PM to ask an agent)" className="h-9 min-w-0 flex-1 rounded-full bg-white/10 px-3.5 text-[12.5px] text-white outline-none placeholder:text-white/40 focus:bg-white/15" />
        </form>
        <button onClick={leave} className="flex h-9 items-center gap-1.5 rounded-full bg-[#e5484d] px-3.5 text-[12.5px] font-semibold text-white hover:brightness-105">
          {Icon.leave} Leave
        </button>
      </div>
      {call.agents.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1.5 text-[11px] text-white/50">
          Agents in the call:
          {call.agents.map((a) => (
            <span key={a} className="flex items-center gap-1 rounded-full bg-white/10 py-0.5 pl-1 pr-1.5 text-white/80">
              <Face id={a} size={14} /> {nameOf(a)}
              {s.configs[a] && <RuntimeBadge runtime={s.configs[a].runtime} />}
              <button onClick={() => d({ type: "callAgent", room: k, agent: a, on: false })} className="text-white/50 hover:text-white" aria-label={`Remove ${nameOf(a)}`}>
                ✕
              </button>
            </span>
          ))}
          <button onClick={() => ui.openPanel("conversations")} className="ml-auto font-semibold text-white/60 hover:text-white">
            Transcripts →
          </button>
        </div>
      )}
    </motion.div>
  );
}

function CtlBtn({ on, onClick, title, children }: { on: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} className={`grid h-9 w-9 place-items-center rounded-full transition-colors ${on ? "bg-white text-ink" : "bg-white/10 text-white hover:bg-white/20"}`}>
      {children}
    </button>
  );
}

/** Voice and video: join whoever's in the room with you, or a 1:1 call. */
export function CallDock() {
  const { s, d } = useSim();
  const ui = useUI();
  const here = ui.here;
  const mine = Object.keys(s.calls).find((k) => s.calls[k].people.includes(s.me));
  const others = useMemo(() => peopleIn(s, here), [s, here]);
  const roomCall = here ? s.calls[here] : undefined;
  const active = roomCall && roomCall.people.filter((p) => p !== s.me).length > 0;

  // Walking out of a room leaves its call.
  const prev = useRef(here);
  useEffect(() => {
    if (prev.current !== here && mine && mine === prev.current) {
      d({ type: "leaveCall", room: mine, id: s.me });
      d({ type: "toast", toast: { id: `left-${mine}-${s.clock}`, who: s.me, text: `You left the ${roomName(mine)} call.` } });
    }
    prev.current = here;
  }, [here, mine, d, s.me, s.clock]);

  const net = useLive();
  const ring = net.ring && net.ring.call !== mine ? net.ring : null;

  return (
    <div className="pointer-events-none absolute left-3 top-[68px] z-[35] flex flex-col items-start gap-2">
      <AnimatePresence>
        {ring && (
          <motion.div
            key="ring"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-[#16151a]/95 py-1.5 pl-1.5 pr-1.5 text-white shadow-[var(--shadow-card)] ring-2 ring-[#5fd08a]/60"
          >
            <Face id={ring.from} size={28} />
            <span className="text-[12.5px]">
              <b>{nameOf(ring.from)}</b> is calling you
            </span>
            <button
              onClick={() => {
                if (mine) d({ type: "leaveCall", room: mine, id: s.me });
                d({ type: "joinCall", room: ring.call, id: ring.from, topic: `${nameOf(ring.from)} and you` });
                d({ type: "joinCall", room: ring.call, id: s.me });
                setLive({ ring: null });
              }}
              className="flex items-center gap-1.5 rounded-full bg-[#5fd08a] px-3 py-1 text-[12px] font-bold text-[#0f2a1a]"
            >
              {Icon.phone} Answer
            </button>
            <button onClick={() => setLive({ ring: null })} className="rounded-full px-2.5 py-1 text-[12px] font-semibold text-white/60 hover:bg-white/10">
              Not now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {mine ? (
          <Call key={mine} k={mine} />
        ) : here && (active || others.length > 0) && here !== "ceo" ? (
          <motion.div
            key={`prompt-${here}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            data-tour="call-prompt"
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-[#16151a]/90 py-1.5 pl-2 pr-1.5 text-white shadow-[var(--shadow-card)] backdrop-blur"
          >
            <span className="flex -space-x-1.5">
              {(active ? roomCall!.people : others).slice(0, 3).map((p) => (
                <span key={p} className="rounded-[8px] ring-2 ring-[#16151a]">
                  <Face id={p} size={22} />
                </span>
              ))}
            </span>
            <span className="text-[12.5px]">
              {active ? (
                <>
                  <b>{roomCall!.people.map(nameOf).join(" and ")}</b> {roomCall!.people.length > 1 ? "are" : "is"} on a call · {roomCall!.topic}
                </>
              ) : (
                <>
                  <b>{others.map(nameOf).join(" and ")}</b> {others.length > 1 ? "are" : "is"} in this room
                </>
              )}
            </span>
            <button
              onClick={() => {
                if (active) d({ type: "joinCall", room: here, id: s.me });
                else {
                  d({ type: "joinCall", room: here, id: s.me, topic: `${roomName(here)} room` });
                  // Simulated people join; real people see the call and choose.
                  others.filter((p) => !s.people[p]?.real).forEach((p) => d({ type: "joinCall", room: here, id: p }));
                }
              }}
              className="flex items-center gap-1.5 rounded-full bg-[#5fd08a] px-3 py-1 text-[12px] font-bold text-[#0f2a1a]"
            >
              {Icon.phone} {active ? "Join" : "Start a call"}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
