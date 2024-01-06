import { app, BrowserWindow, ipcMain, dialog, Menu } from "electron";
import path from "node:path";
import fs from "node:fs";
import { getSqlite3 } from "./better-sqlite3";
import type { Database } from "better-sqlite3";
import type {
  DoingNow,
  Thoughts,
  Mood,
  Activity,
  Log,
  TextLog,
  EmojiLog,
  Kind,
  Day,
  DayRating,
  DaySummary,
  DayRatingKind,
  TextEntry,
  EmojiEntry,
  QueryResult,
} from "../types/electron";

process.env.DIST = path.join(__dirname, "../dist");
process.env.DIST_DATA = path.join(__dirname, "../dist-data");
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, "../public");

const entriesPerPage = 100.0;

let db: Database;
function loadDatabase() {
  db = getSqlite3("db.sqlite");
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const expectedVersion = 1;
  const currentVersion = db.pragma("user_version", { simple: true }) as number;
  if (currentVersion === 0) {
    const initialSchema = fs.readFileSync(
      path.join(process.env.DIST_DATA, "initial_schema.sql"),
      "utf8"
    );
    db.exec(initialSchema);
    db.pragma(`user_version = ${expectedVersion}`);
  } else if (currentVersion < expectedVersion) {
    for (let i = currentVersion + 1; i <= expectedVersion; ++i) {
      const migrationScript = fs.readFileSync(
        path.join(
          process.env.DIST_DATA,
          `migrations/migration_v${i - 1}_to_v${i}.sql`
        ),
        "utf8"
      );
      db.exec(migrationScript);
      db.pragma(`user_version = ${i}`);
    }
  }
}

let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

function openChannels() {
  function getKindName(log: EmojiLog) {
    if (log === "Mood") return "MoodKind";
    else if (log === "Activity") return "ActivityKind";
  }
  ipcMain.handle("submit-text", (event, log: TextLog, content) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const res = db
      .prepare(`insert into ${log}(content,timestamp) values (?,?)`)
      .run(content, timestamp);
    if (res) return res.lastInsertRowid;
    return -1;
  });
  ipcMain.handle("submit-emoji", (event, log: EmojiLog, code) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const res = db
      .prepare(`insert into ${log}(kind,timestamp) values (?,?)`)
      .run(code, timestamp);
    if (res) return res.lastInsertRowid;
    return -1;
  });
  ipcMain.handle("get-text-entries", (event, log: TextLog) => {
    const entries = db.prepare(`select * from ${log}`).all() as
      | DoingNow[]
      | Thoughts[];
    return entries;
  });
  ipcMain.handle("get-emoji-entries", (event, log: EmojiLog) => {
    const entries = db.prepare(`select * from ${log}`).all() as
      | Mood[]
      | Activity[];
    return entries;
  });
  ipcMain.handle("get-kinds", (event, log: EmojiLog) => {
    const kindName = getKindName(log);
    const kinds = db.prepare(`select * from ${kindName}`).all() as Kind[];
    return kinds;
  });
  ipcMain.on("delete-entry", (event, log: TextLog | EmojiLog, id) => {
    db.prepare(`delete from ${log} where id = ?`).run(id);
  });
  ipcMain.on("relabel-kind", (event, log: EmojiLog, code, label) => {
    const kindName = getKindName(log);
    db.prepare(`update ${kindName} set label = ? where code = ?`).run(
      label,
      code
    );
  });
  ipcMain.on("submit-kind", (event, log: EmojiLog, code, label) => {
    const kindName = getKindName(log);
    db.prepare(`insert into ${kindName}(code,label) values (?,?)`).run(
      code,
      label
    );
  });
  ipcMain.on("toggle-visibility-kind", (event, log: EmojiLog, code) => {
    const kindName = getKindName(log);
    db.prepare(
      `update ${kindName} set hidden = case when hidden = 0 then 1 else 0 end where code = ?`
    ).run(code);
  });
  ipcMain.on("delete-kind", (event, log: EmojiLog, code) => {
    const kindName = getKindName(log);
    db.prepare(`delete from ${kindName} where code = ?`).run(code);
  });
  ipcMain.handle("get-day-summaries", () => {
    const days = db.prepare("select * from Day").all() as Day[];
    const ratings = db.prepare("select * from DayRating").all() as DayRating[];
    const summaries: Record<string, DaySummary> = {};
    days.forEach(
      (day, idx) => (summaries[day.date] = { day: day, ratings: [] })
    );
    ratings.forEach((rating, idx) =>
      summaries[rating.date].ratings.push(rating)
    );
    return Object.values(summaries);
  });
  ipcMain.handle("get-day-rating-kinds", () => {
    const ratingKinds = db
      .prepare("select * from DayRatingKind")
      .all() as DayRatingKind[];
    return ratingKinds;
  });
  ipcMain.on("submit-day-summary", (event, summary: DaySummary) => {
    db.prepare("insert or replace into Day values (?,?)").run(
      summary.day.date,
      summary.day.content
    );
    summary.ratings.forEach((rating) =>
      db
        .prepare("insert or replace into DayRating values (?,?,?)")
        .run(rating.date, rating.kind, rating.magnitude)
    );
  });
  ipcMain.on("delete-day-summary", (event, date: string) => {
    db.prepare("delete from Day where date = ?").run(date);
  });
  ipcMain.handle("search", (event, query) => {
    const queryStr = `%${query}%`;
    const queryResult: QueryResult = {
      doingNowEntries: [],
      thoughtsEntries: [],
      moodEntries: [],
      activityEntries: [],
      daySummaries: [],
    };
    const doingNowEntries = db
      .prepare("select * from DoingNow where content like ?")
      .all(queryStr) as DoingNow[];
    queryResult.doingNowEntries = doingNowEntries;
    return queryResult;
  });

  ipcMain.handle("getNumPages", (event, log: Log) => {
    const res = db.prepare(`select count(*) from ${log}`).get() as {
      "count(*)": number;
    };
    const num = res["count(*)"];
    return Math.ceil(num / entriesPerPage);
  });
  ipcMain.handle("getPage", (event, log: Log, pageNum) => {
    if (log === "Day") {
      const days = db
        .prepare(
          `select * from Day order by Date(date) limit ${entriesPerPage} offset ${
            (pageNum - 1) * entriesPerPage
          }`
        )
        .all() as Day[];
      const ratings = db
        .prepare("select * from DayRating")
        .all() as DayRating[];
      const summaries: Record<string, DaySummary> = {};
      days.forEach(
        (day, idx) => (summaries[day.date] = { day: day, ratings: [] })
      );
      ratings.forEach((rating, idx) => {
        if (summaries[rating.date] !== undefined)
          summaries[rating.date].ratings.push(rating);
      });
      return Object.values(summaries);
    } else {
      const res = db
        .prepare(
          `select * from ${log} order by id limit ${entriesPerPage} offset ${
            (pageNum - 1) * entriesPerPage
          }`
        )
        .all() as DoingNow[] | Thoughts[] | Mood[] | Activity[];
      return res;
    }
  });
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    width: 600,
    height: 800,
  });

  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, "index.html"));
  }

  if (process.platform === "darwin") {
    const menu = Menu.buildFromTemplate([
      { label: "defacto" },
      {
        label: "Options",
        submenu: [{ label: "View Options", click: () => openOptionsWindow() }],
      },
    ]);
    Menu.setApplicationMenu(menu);
  } else {
    const menu = Menu.buildFromTemplate([
      {
        label: "Options",
        click: () => openOptionsWindow(),
      },
    ]);
    win.setMenu(menu);
  }
}

function openOptionsWindow() {
  if (!win) return;
  const optionsWin = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
    parent: win,
  });
  optionsWin.removeMenu();

  if (VITE_DEV_SERVER_URL) {
    optionsWin.webContents.openDevTools();
    const url = "http://localhost:5174/index-options.html";
    optionsWin.loadURL(url);
  } else {
    optionsWin.loadFile(path.join(process.env.DIST, "index-options.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  loadDatabase();
  openChannels();
  createWindow();
});
