"use client";

import { useSyncExternalStore } from "react";

/**
 * Live-session state that never goes in the saved office: who's connected,
 * their media streams, and an incoming call. A tiny external store.
 */
export interface LiveState {
  code: string | null;
  status: "off" | "connecting" | "live";
  /** Trystero peer id → person id. */
  peers: Record<string, string>;
  /** Person id → their incoming audio/video. */
  streams: Record<string, MediaStream>;
  /** Bumps when a stream gains or loses a track. */
  ver: number;
  ring: { call: string; from: string } | null;
  /** The name others see for you. */
  name: string;
  cam: boolean;
  mic: boolean;
}

let state: LiveState = { code: null, status: "off", peers: {}, streams: {}, ver: 0, ring: null, name: "", cam: false, mic: false };
const subs = new Set<() => void>();

export const getLive = () => state;
export function setLive(patch: Partial<LiveState> | ((s: LiveState) => Partial<LiveState>)) {
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  subs.forEach((f) => f());
}
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => subs.delete(f);
};
const server = () => state;
export const useLive = () => useSyncExternalStore(subscribe, getLive, server);

/* ------------------------------------------------------------- event bus */

export type CallLine = { call: string; who: string; text: string; voice: boolean };
type Events = { line: CallLine };
const bus: { [K in keyof Events]: Set<(e: Events[K]) => void> } = { line: new Set() };
export function onLive<K extends keyof Events>(k: K, f: (e: Events[K]) => void) {
  bus[k].add(f);
  return () => {
    bus[k].delete(f);
  };
}
export const emitLive = <K extends keyof Events>(k: K, e: Events[K]) => bus[k].forEach((f) => f(e));

/* --------------------------------------------------------------- identity */

const rand = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => "abcdefghjkmnpqrstuvwxyz23456789"[b % 31]).join("");

/** A stable id for this tab, so a refresh is the same person (and two tabs are two people). */
let memUid = "";
export function myUid() {
  try {
    let u = sessionStorage.getItem("floorplan-uid");
    if (!u) {
      u = rand(8);
      sessionStorage.setItem("floorplan-uid", u);
    }
    return u;
  } catch {
    return (memUid ||= rand(8));
  }
}
export const publicId = () => `u-${myUid()}`;
export const newCode = () => `${rand(3)}-${rand(4)}`.toUpperCase();

export const liveLink = (code: string) => `${window.location.origin}/office?live=${encodeURIComponent(code)}`;

/** Where you're standing, in tiles (written by the office as you move). */
export const myPos = { x: 0, y: 0 };
