"use client";

import type { JsonValue, Room } from "trystero";
import { getLive, setLive } from "./state";

/**
 * Peer-to-peer link between real people, with no backend of our own.
 * Browsers find each other through public Nostr relays (signalling only),
 * then talk directly over WebRTC: data for presence and chat, media for calls.
 */

export type Look = { [k: string]: JsonValue };

export interface Profile {
  [k: string]: JsonValue;
  id: string;
  name: string;
  title: string;
  role: "ceo" | "lead" | "member";
  room: string | null;
  look: Look;
  at: [number, number];
  /** The call you're in, in wire form (see toWire). */
  call: string | null;
  cam: boolean;
  mic: boolean;
}

export type WireMsg = { [k: string]: JsonValue; id: string; channel: string; who: string; text: string; t: string; agent: boolean; to: string | null };

export type Cmd =
  | { type: "assign"; id: string; room: string; role: string | null }
  | { type: "line"; call: string; who: string; text: string; voice: boolean }
  | { type: "agent"; call: string; agent: string; on: boolean }
  | { type: "ring"; call: string; from: string }
  | { type: "ask"; from: string };

export interface Handlers {
  profile: (p: Profile, peerId: string) => void;
  pos: (id: string, at: [number, number]) => void;
  msg: (m: WireMsg) => void;
  cmd: (c: Cmd, from: string) => void;
  leave: (id: string) => void;
  hello: (peerId: string) => void;
  stream: () => void;
}

const APP = "floorplan-office-v1";

let room: Room | null = null;
let send: {
  pro?: (d: Profile, t?: string | string[]) => void;
  pos?: (d: [string, number, number]) => void;
  msg?: (d: WireMsg, t?: string | string[]) => void;
  cmd?: (d: { [k: string]: JsonValue }, t?: string | string[]) => void;
} = {};
let handlers: Handlers | null = null;
/** Bumps on every connect/disconnect so a slow connect can't revive an old room. */
let gen = 0;

export const setHandlers = (h: Handlers) => (handlers = h);

export async function connect(code: string) {
  if (room) await disconnect();
  const mine = ++gen;
  setLive({ code, status: "connecting", peers: {}, streams: {} });
  const { joinRoom } = await import("trystero/nostr");
  if (mine !== gen) return;
  const r = joinRoom({ appId: APP, password: `fp-${code}` }, code.toUpperCase());
  room = r;

  const pro = r.makeAction<Profile>("pro");
  const pos = r.makeAction<[string, number, number]>("pos");
  const msg = r.makeAction<WireMsg>("msg");
  const cmd = r.makeAction<{ [k: string]: JsonValue }>("cmd");
  send = {
    pro: (d, t) => void pro.send(d, { target: t ?? null }).catch(() => {}),
    pos: (d) => void pos.send(d).catch(() => {}),
    msg: (d, t) => void msg.send(d, { target: t ?? null }).catch(() => {}),
    cmd: (d, t) => void cmd.send(d, { target: t ?? null }).catch(() => {}),
  };

  pro.onMessage = (p, { peerId }) => {
    if (getLive().peers[peerId] !== p.id) setLive((s) => ({ peers: { ...s.peers, [peerId]: p.id } }));
    handlers?.profile(p, peerId);
  };
  pos.onMessage = ([id, x, y]) => handlers?.pos(id, [x, y]);
  msg.onMessage = (m) => handlers?.msg(m);
  cmd.onMessage = (c, { peerId }) => handlers?.cmd(c as unknown as Cmd, getLive().peers[peerId] ?? peerId);

  r.onPeerJoin = (peerId) => {
    setLive({ status: "live" });
    handlers?.hello(peerId);
  };
  r.onPeerLeave = (peerId) => {
    const id = getLive().peers[peerId];
    setLive((s) => {
      const peers = { ...s.peers };
      delete peers[peerId];
      const streams = { ...s.streams };
      if (id) delete streams[id];
      return { peers, streams };
    });
    if (id) handlers?.leave(id);
  };
  r.onPeerStream = (stream, peerId) => {
    const id = getLive().peers[peerId];
    if (!id) return;
    setLive((s) => ({ streams: { ...s.streams, [id]: stream }, ver: s.ver + 1 }));
    stream.onaddtrack = () => setLive((s) => ({ ver: s.ver + 1 }));
    stream.onremovetrack = () => setLive((s) => ({ ver: s.ver + 1 }));
    handlers?.stream();
  };
  r.onPeerTrack = () => setLive((s) => ({ ver: s.ver + 1 }));
  // Connected to the relays: you're live even if nobody else is here yet.
  setTimeout(() => getLive().code === code && setLive({ status: "live" }), 1200);
}

export async function disconnect() {
  gen++;
  const r = room;
  room = null;
  send = {};
  setLive({ status: "off", code: null, peers: {}, streams: {}, ring: null });
  await r?.leave().catch(() => {});
}

/** Peer ids for some person ids. */
export const peersOf = (ids: string[]) =>
  Object.entries(getLive().peers)
    .filter(([, id]) => ids.includes(id))
    .map(([p]) => p);

export const sendProfile = (p: Profile, to?: string) => send.pro?.(p, to);
export const sendPos = (id: string, at: [number, number]) => send.pos?.([id, Math.round(at[0] * 100) / 100, Math.round(at[1] * 100) / 100]);
export const sendMsg = (m: WireMsg, to?: string[]) => send.msg?.(m, to);
export const sendCmd = (c: Cmd, to?: string[]) => send.cmd?.(c as unknown as { [k: string]: JsonValue }, to);

/* ------------------------------------------------------------------ media */

let local: MediaStream | null = null;
const sentTo = new Set<string>();

export const localStream = () => local;

/** Your mic (and camera) for calls with real people. */
export async function ensureLocal(video: boolean) {
  if (!local) local = new MediaStream();
  if (!local.getAudioTracks().length) {
    try {
      const a = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      a.getAudioTracks().forEach((t) => {
        local!.addTrack(t);
        if (room && sentTo.size) room.addTrack(t, local!, { target: [...sentTo] });
      });
    } catch {
      /* no mic: you can still listen and type */
    }
  }
  if (video && !local.getVideoTracks().length) {
    const v = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
    v.getVideoTracks().forEach((t) => {
      local!.addTrack(t);
      if (room && sentTo.size) room.addTrack(t, local!, { target: [...sentTo] });
    });
  }
  if (!video)
    local.getVideoTracks().forEach((t) => {
      if (room && sentTo.size) room.removeTrack(t, { target: [...sentTo] });
      t.stop();
      local!.removeTrack(t);
    });
  return local;
}

export function setMic(on: boolean) {
  local?.getAudioTracks().forEach((t) => (t.enabled = on));
}

/** Send your media to exactly these peers (the real people in your call). */
export function streamTo(peerIds: string[]) {
  if (!room || !local) return;
  const want = new Set(peerIds);
  const add = peerIds.filter((p) => !sentTo.has(p));
  const drop = [...sentTo].filter((p) => !want.has(p));
  if (add.length) room.addStream(local, { target: add });
  if (drop.length) room.removeStream(local, { target: drop });
  add.forEach((p) => sentTo.add(p));
  drop.forEach((p) => sentTo.delete(p));
}

export function stopLocal() {
  streamTo([]);
  local?.getTracks().forEach((t) => t.stop());
  local = null;
}
