import type { IpcRendererEvent } from "electron";

export interface API {
  submitText: (log: TextLog, content: string) => Promise<number>;
  submitEmoji: (log: EmojiLog, code: string) => Promise<number>;
  getTextEntries: (log: TextLog) => Promise<DoingNow[] | Thoughts[]>;
  getEmojiEntries: (log: EmojiLog) => Promise<Mood[] | Activity[]>;
  getKinds: (log: EmojiLog) => Promise<MoodKind[] | ActivityKind[]>;
  deleteEntry: (log: TextLog | EmojiLog, id: number) => void;
  relabelKind: (log: EmojiLog, code: string, label: string) => void;
  submitKind: (log: EmojiLog, code: string, label: string) => void;
  toggleVisibilityKind: (log: EmojiLog, code: string) => void;
  deleteKind: (log: EmojiLog, code: string) => void;
  getDaySummaries: () => Promise<DaySummary[]>;
  getDayRatingKinds: () => Promise<DayRatingKind[]>;
  submitDaySummary: (summary: DaySummary) => void;
  deleteDaySummary: (date: string) => void;
  search: (query: string) => Promise<QueryResult>;
  getNumPages: (log: Log) => Promise<number>;
  getPage: (
    log: Log,
    pageNum: number
  ) => Promise<DoingNow[] | Thoughts[] | Mood[] | Activity[] | DaySummary[]>;
}

export interface QueryResult {
  doingNowEntries: DoingNow[];
  thoughtsEntries: Thoughts[];
  moodEntries: Mood[];
  activityEntries: Activity[];
  daySummaries: DaySummary[];
}

export interface DoingNow {
  id: number;
  content: string;
  timestamp: number;
}

export interface Thoughts {
  id: number;
  content: string;
  timestamp: number;
}

export interface MoodKind {
  code: string;
  label: string;
  hidden: boolean;
}

export interface Mood {
  id: number;
  kind: string;
  timestamp: number;
}

export interface ActivityKind {
  code: string;
  label: string;
  hidden: boolean;
}

export interface Activity {
  id: number;
  kind: string;
  timestamp: number;
}

export interface Day {
  date: string;
  content: string;
}

export interface DayRating {
  date: string;
  kind: string;
  magnitude: number;
}

export interface DaySummary {
  day: Day;
  ratings: DayRating[];
}

export interface DayRatingKind {
  kind: string;
}

export type TextEntry = DoingNow | Thoughts;
export type EmojiEntry = Mood | Activity;
export type Kind = MoodKind | ActivityKind;
export type Log = "DoingNow" | "Thoughts" | "Mood" | "Activity" | "Day";
export type TextLog = "DoingNow" | "Thoughts";
export type EmojiLog = "Mood" | "Activity";
