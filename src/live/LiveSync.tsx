"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { CAST, spot } from "@/office/layout";
import { clockLabel, dmKey, roomName, useSim, type SimState } from "@/sim/store";
import type { Person } from "@/sim/types";
import { connect, disconnect, sendCmd, sendMsg, sendPos, sendProfile, peersOf, setHandlers, type Cmd, type Look, type Profile, type WireMsg } from "./net";
import { emitLive, getLive, myPos, publicId, setLive, useLive } from "./state";

/* ----------------------------------------------------------- id mapping */

/** Your id as other people see it: real joiners are themselves, anyone else is their browser. */
export const myPublic = (s: SimState) => (s.people[s.me]?.real ? s.me : publicId());

/** Direct-call keys name both people; swap your local id for your public one (and back). */
const swap = (k: string, from: string, to: string) => (k.startsWith("p2p:") ? `p2p:${k.slice(4).split("|").map((x) => (x === from ? to : x)).sort().join("|")}` : k);
export const toWire = (s: SimState, k: string | null | undefined) => (k ? swap(k, s.me, myPublic(s)) : null);
export const fromWire = (s: SimState, k: string | null) => (k ? swap(k, myPublic(s), s.me) : null);

export const myCall = (s: SimState) => Object.keys(s.calls).find((k) => s.calls[k].people.includes(s.me)) ?? null;

function profileOf(s: SimState): Profile {
  const p = s.people[s.me];
  const live = getLive();
  const at = myPos.x || myPos.y ? myPos : (() => {
    const [x, y] = spot(s.live[s.me]?.at ?? "hall:mid");
    return { x, y };
  })();
  return {
    id: myPublic(s),
    name: live.name || (s.me === "you" ? "CEO" : (p?.full ?? "Guest")),
    title: p?.title ?? "CEO",
    role: p?.role ?? "ceo",
    room: p?.room ?? null,
    look: (p?.look ?? CAST[s.me]?.look ?? CAST.you.look) as unknown as Look,
    at: [Math.round(at.x * 100) / 100, Math.round(at.y * 100) / 100],
    call: toWire(s, myCall(s)),
    cam: live.cam,
    mic: live.mic,
  };
}

/* ------------------------------------------------------------- sessions */

const FLAG = (code: string) => `floorplan-live:${code}`;

export function liveCodeFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("live")?.toUpperCase() ?? null;
}

export function hasJoined(code: string) {
  try {
    return sessionStorage.getItem(FLAG(code)) === "1";
  } catch {
    return false;
  }
}

export function markJoined(code: string, name: string) {
  try {
    sessionStorage.setItem(FLAG(code), "1");
    localStorage.setItem("floorplan-live-name", name);
  } catch {
    /* fine: you'll be asked again next time */
  }
}

export function savedName() {
  try {
    return localStorage.getItem("floorplan-live-name") ?? "";
  } catch {
    return "";
  }
}

/** Host: start a session and put its code in the address bar to share. */
export function startSession(code: string, name: string) {
  markJoined(code, name);
  setLive({ name });
  const u = new URL(window.location.href);
  u.searchParams.set("live", code);
  window.history.replaceState(null, "", u);
  void connect(code);
}

export function endSession() {
  const code = getLive().code;
  if (code)
    try {
      sessionStorage.removeItem(FLAG(code));
    } catch {
      /* ignore */
    }
  const u = new URL(window.location.href);
  u.searchParams.delete("live");
  window.history.replaceState(null, "", u);
  void disconnect();
}

/** Relay a chat message you (or an agent you pulled in) just wrote. */
export function relayMsg(s: SimState, m: { channel: string; who: string; text: string; t: string; agent?: boolean }) {
  if (getLive().status === "off") return;
  const who = m.who === s.me ? myPublic(s) : m.who;
  const id = `${who}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (m.channel.startsWith("dm:")) {
    const other = m.channel.slice(3).split("|").find((x) => x !== s.me) ?? "";
    if (!s.people[other]?.real) return;
    sendMsg({ id, channel: "dm", who, text: m.text, t: m.t, agent: !!m.agent, to: other }, peersOf([other]));
    return;
  }
  sendMsg({ id, channel: m.channel, who, text: m.text, t: m.t, agent: !!m.agent, to: null });
}

/** Tell the real people in a call about a line (yours, or an agent's). */
export function relayLine(s: SimState, call: string, who: string, text: string, voice: boolean) {
  if (getLive().status === "off") return;
  const ids = s.calls[call]?.people.filter((p) => s.people[p]?.real && p !== s.me) ?? [];
  if (!ids.length) return;
  sendCmd({ type: "line", call: toWire(s, call)!, who: who === s.me ? myPublic(s) : who, text, voice }, peersOf(ids));
}

export function relayCmd(s: SimState, c: Cmd, toIds: string[]) {
  if (getLive().status === "off") return;
  const peers = peersOf(toIds);
  if (peers.length) sendCmd(c, peers);
}

/* ------------------------------------------------------------------ sync */

/** Keeps the office in step with real people connected to the same session. */
export function LiveSync() {
  const { s, d } = useSim();
  const live = useLive();
  const sRef = useRef(s);
  useLayoutEffect(() => {
    sRef.current = s;
  });

  // Reconnect on load if you've already joined this session.
  useEffect(() => {
    const code = liveCodeFromUrl();
    if (code && hasJoined(code) && getLive().status === "off") {
      setLive({ name: savedName() });
      void connect(code);
    }
    return () => {
      void disconnect();
    };
  }, []);

  useEffect(() => {
    setHandlers({
      hello: (peerId) => sendProfile(profileOf(sRef.current), peerId),
      profile: (p) => {
        const st = sRef.current;
        if (p.id === myPublic(st)) return;
        const first = !st.people[p.id] || st.people[p.id].presence === "offline";
        const person: Person = {
          id: p.id,
          name: p.name.split(/\s+/)[0] || "Guest",
          full: p.name,
          title: p.title,
          role: p.role,
          room: p.room,
          presence: p.call ? "call" : "online",
          email: "Joined live, no account",
          joined: `Live since ${clockLabel(st.clock, false)}`,
          real: true,
          look: p.look as unknown as Person["look"],
        };
        if (!CAST[p.id]) CAST[p.id] = { id: p.id, name: person.name, role: p.title, room: "ceo", human: true, real: true, look: person.look! };
        d({ type: "realUpsert", person, at: p.at, call: fromWire(st, p.call) });
        if (first) d({ type: "toast", toast: { id: `live-in-${p.id}`, who: "ada", text: `${p.name} joined the office live${p.room ? ` and is in ${roomName(p.room)}` : ""}. Say hi!`, action: { label: "People", panel: "people" } } });
      },
      pos: (id, at) => {
        if (sRef.current.people[id]?.real) d({ type: "live", id, patch: { at } });
      },
      msg: (m: WireMsg) => {
        const st = sRef.current;
        if (m.channel === "dm") {
          if (m.to !== myPublic(st)) return;
          d({ type: "post", channel: dmKey(st.me, m.who), msg: { id: m.id, who: m.who, t: m.t, text: m.text, agent: m.agent } });
          if (m.who !== st.me) d({ type: "toast", toast: { id: `dm-${m.id}`, who: m.who, text: m.text } });
        } else if (m.channel.startsWith("room:")) {
          d({ type: "convo", id: m.channel === "room:dev" ? "c-dev" : "c-mkt", msg: { who: m.who, t: m.t, text: m.text } });
        } else {
          d({ type: "post", channel: m.channel, msg: { id: m.id, who: m.who, t: m.t, text: m.text, agent: m.agent } });
        }
      },
      cmd: (c, from) => {
        const st = sRef.current;
        if (c.type === "assign" && c.id === myPublic(st)) {
          d({ type: "assignPerson", id: st.me, room: c.room, role: (c.role as Person["role"]) ?? undefined, by: from });
          d({ type: "toast", toast: { id: `as-live-${st.clock}`, who: from, text: `${st.people[from]?.name ?? "The CEO"} put you in ${roomName(c.room)}. Walking you over.` } });
        }
        if (c.type === "ring") setLive({ ring: { call: fromWire(st, c.call)!, from: c.from } });
        if (c.type === "ask") d({ type: "toast", toast: { id: `ask-${from}-${st.clock}`, who: from, text: `${st.people[from]?.name ?? "Someone"} asks you to come over.` } });
        if (c.type === "line") emitLive("line", { call: fromWire(st, c.call)!, who: c.who, text: c.text, voice: c.voice });
        if (c.type === "agent") {
          const call = fromWire(st, c.call)!;
          if (st.calls[call]) d({ type: "callAgent", room: call, agent: c.agent, on: c.on });
        }
      },
      leave: (id) => {
        const p = sRef.current.people[id];
        d({ type: "realGone", id });
        if (p) d({ type: "toast", toast: { id: `live-out-${id}`, who: "ada", text: `${p.full} left the office.` } });
      },
      stream: () => {},
    });
  }, [d]);

  // Positions: a few times a second while you move.
  useEffect(() => {
    if (live.status === "off") return;
    let last = "";
    const t = setInterval(() => {
      const k = `${myPos.x.toFixed(2)},${myPos.y.toFixed(2)}`;
      if (k !== last && (myPos.x || myPos.y)) {
        last = k;
        sendPos(myPublic(sRef.current), [myPos.x, myPos.y]);
      }
    }, 180);
    return () => clearInterval(t);
  }, [live.status]);

  // Profile: whenever it changes, and a heartbeat for anyone who missed it.
  const p = live.status === "off" ? "" : JSON.stringify({ ...profileOf(s), at: null });
  useEffect(() => {
    if (!p) return;
    sendProfile(profileOf(sRef.current));
    const t = setInterval(() => sendProfile(profileOf(sRef.current)), 4000);
    return () => clearInterval(t);
  }, [p]);

  return null;
}
