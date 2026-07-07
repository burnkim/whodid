// defaults.js — storage keys + default slices.

// v2: adds the optional `members` slice + `entry.by` attribution ("who did it").
// The migration is purely additive — every v1 field is preserved untouched.
export const SCHEMA_VERSION = 2

export const KEYS = {
  chores: 'whodid:chores',
  logs: 'whodid:logs',
  streak: 'whodid:streak',
  settings: 'whodid:settings',
  members: 'whodid:members',
}

export const CORRUPT_BACKUP_KEY = 'whodid:corruptBackup'

// A chore's `days` lists the weekday indices (0=Sun..6=Sat) it's due on.
// All seven = "매일" (the default); a subset = "특정 요일".
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

// Curated, low-saturation "people" palette — a lane of its own, deliberately
// distinct from the sage accent + grass ramp so member colors never fight the brand.
export const MEMBER_COLORS = [
  '#5b8a72', // sage-leaning green
  '#c98a5e', // warm clay
  '#6d8bb0', // muted slate blue
  '#b0794e', // terracotta
  '#8a7bab', // dusty lavender
  '#9a9457', // olive
]

export const DEFAULT_SETTINGS = {
  schemaVersion: SCHEMA_VERSION,
  theme: 'system', // 'system' | 'light' | 'dark'
  accent: 'sage',
  hapticEnabled: true,
  sortMode: 'undone-first', // 'undone-first' | 'manual'
  confirmDelete: true,
  onboarded: false,
  lastSeenDate: null,
  lastConfettiDate: null,
  lastExportAt: null,
  activeMemberId: null, // who taps attribute to; null = 미지정 (solo)
}

export const DEFAULT_STREAK = {
  current: 0,
  longest: 0,
  lastActiveDate: null,
}

// Empty initial slices (onboarding seeds chores).
export const DEFAULT_CHORES = []
export const DEFAULT_LOGS = {}
export const DEFAULT_MEMBERS = []
