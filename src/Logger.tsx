import { useState, useEffect, useRef } from "react";
import {
  DoingNow,
  MoodKind,
  Thoughts,
  Mood,
  Activity,
  ActivityKind,
  Log,
  TextEntry,
  EmojiEntry,
  TextLog,
  EmojiLog,
} from "../types/electron";
import { format } from "date-fns";
import DayView from "./DayView";
import Search from "./Search";
import Pagination from "./Pagination";
import { colors } from "./util";

const scrollToBottom = (logRef: React.RefObject<HTMLDivElement>) => {
  if (logRef.current) {
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }
};

function timestampToDateString(timestamp: number) {
  const milliseconds = timestamp * 1000;
  const dateObject = new Date(milliseconds);
  const formattedDate = format(dateObject, "MM-dd HH:mm");
  return formattedDate;
}

function LogContainer({
  logRef,
  entryNodes,
}: {
  logRef: React.RefObject<HTMLDivElement>;
  entryNodes: React.ReactNode[];
}) {
  return (
    <div
      ref={logRef}
      css={{
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexGrow: 1,
        marginLeft: 0,
      }}
    >
      {entryNodes}
    </div>
  );
}

function EntryView({
  entry,
  entryNode,
  deleteEntry,
}: {
  entry: TextEntry | EmojiEntry;
  entryNode: React.ReactNode;
  deleteEntry: (id: number) => void;
}) {
  const [mouseOver, setMouseOver] = useState(false);

  return (
    <div
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
      css={{
        display: "flex",
        justifyContent: "space-between",
        "&: hover": {
          background: "rgba(0,0,0,0.1)",
        },
        paddingLeft: 4,
      }}
    >
      <div>
        {"["}
        <span css={{ fontStyle: "italic" }}>
          {timestampToDateString(entry.timestamp)}
        </span>
        {"] "}
        {entryNode}
      </div>
      <button
        css={{
          background: "none",
          borderWidth: 0,
          borderStyle: "solid",
          visibility: mouseOver === true ? "visible" : "hidden",
          "&: hover": { cursor: "pointer", background: colors.blue },
          userSelect: "none",
        }}
        onClick={() => {
          if (confirm("Delete entry")) deleteEntry(entry.id);
        }}
      >
        x
      </button>
    </div>
  );
}

function TextView({
  log,
  textSubmissionPlaceholder,
}: {
  log: TextLog;
  textSubmissionPlaceholder: string;
}) {
  const [text, setText] = useState("");
  const [entries, setEntries] = useState<DoingNow[] | Thoughts[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);

  const getPage = async (pageNum: number) => {
    const entries = (await window.electronAPI.getPage(log, pageNum)) as
      | DoingNow[]
      | Thoughts[];
    setEntries(entries);
  };

  const getEntries = async () => {
    const numPages = await window.electronAPI.getNumPages(log);
    setNumPages(numPages);
    getPage(numPages);
  };

  useEffect(() => {
    getEntries();
  }, [log]);

  const submitEntry = async () => {
    const id = await window.electronAPI.submitText(log, text);
    getEntries();
    setText("");
  };

  const deleteEntry = (id: number) => {
    window.electronAPI.deleteEntry(log, id);
    const newEntries = entries.filter((activity) => activity.id !== id);
    setEntries(newEntries);
  };

  useEffect(() => {
    scrollToBottom(logRef);
  }, [entries]);

  return (
    <>
      <div css={{ margin: 0 }}>
        <Pagination numPages={numPages} getPage={getPage} />
      </div>
      <LogContainer
        logRef={logRef}
        entryNodes={entries.map((entry, idx) => (
          <EntryView
            entry={entry}
            entryNode={entry.content}
            deleteEntry={deleteEntry}
            key={idx}
          />
        ))}
      />

      <div css={{ display: "flex", margin: 0, gap: 0 }}>
        <textarea
          css={{
            flexGrow: 1,
            height: 75,
            resize: "none",
            padding: 4,
            borderRadius: 0,
            borderWidth: 0,
            background: colors.gray,

            ":focus": { outline: "none" },
          }}
          placeholder={textSubmissionPlaceholder}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
          }}
        />
        <button
          css={{
            borderRadius: 0,
            borderWidth: 0,
            "&:enabled:hover": { cursor: "pointer", background: colors.blue },
            userSelect: "none",
            background:colors.gray
          }}
          disabled={text.length === 0}
          onClick={submitEntry}
        >
          Submit
        </button>
      </div>
    </>
  );
}

function EmojiView({ log }: { log: EmojiLog }) {
  const [kinds, setKinds] = useState<MoodKind[] | ActivityKind[]>([]);
  const [entries, setEntries] = useState<Mood[] | Activity[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);

  const getPage = async (pageNum: number) => {
    const entries = (await window.electronAPI.getPage(log, pageNum)) as
      | Mood[]
      | Activity[];
    setEntries(entries);
  };

  const getEntries = async () => {
    const numPages = await window.electronAPI.getNumPages(log);
    setNumPages(numPages);
    getPage(numPages);
  };

  useEffect(() => {
    getEntries();
  }, [log]);

  useEffect(() => {
    const getKinds = async () => {
      const kinds = (await window.electronAPI.getKinds(log)).filter(
        (kind) => !kind.hidden
      );

      setKinds(kinds);
    };
    getKinds();
    getEntries();
  }, [log]);

  const submitEntry = async (code: string) => {
    const id = await window.electronAPI.submitEmoji(log, code);
    getEntries();
  };

  const deleteEntry = (id: number) => {
    window.electronAPI.deleteEntry(log, id);
    const newEntries = entries.filter((mood) => mood.id !== id);
    setEntries(newEntries);
  };

  useEffect(() => {
    scrollToBottom(logRef);
  }, [entries]);

  const Emoji = ({ unicodeValue }: { unicodeValue: string }) => {
    const codePoints = unicodeValue.split("-").map((hex) => parseInt(hex, 16));
    const emoji = String.fromCodePoint(...codePoints);

    return (
      <span role="img" aria-label="emoji">
        {emoji}
      </span>
    );
  };

  return (
    <>
      <div css={{ margin: 0 }}>
        <Pagination numPages={numPages} getPage={getPage} />
      </div>
      <LogContainer
        logRef={logRef}
        entryNodes={entries.map((entry, idx) => (
          <EntryView
            entry={entry}
            entryNode={<Emoji unicodeValue={entry.kind} />}
            deleteEntry={deleteEntry}
            key={idx}
          />
        ))}
      />

      <div
        css={{
          padding: 4,
          background: colors.gray,

          borderWidth: 0,
          borderStyle: "solid",
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {kinds.map((kind, idx) => {
          const codePoints = kind.code
            .split("-")
            .map((hex) => parseInt(hex, 16));
          const emoji = String.fromCodePoint(...codePoints);

          return (
            <div
              key={idx}
              onClick={() => submitEntry(kind.code)}
              css={{
                fontSize: 32,
                cursor: "pointer",
                "&: hover": { background: "rgba(0,0,0,0.1)" },
                userSelect: "none",
                borderRadius: "50%",
                padding: 2,
              }}
              role="img"
              aria-label="emoji"
            >
              {emoji}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function Logger() {
  type View = Log;
  const [activeView, setActiveView] = useState<View>("Day");

  const ViewButton = ({
    children,
    view,
  }: {
    children: React.ReactNode;
    view: View;
  }) => {
    return (
      <button
        css={{
          borderRadius: 0,
          borderWidth: 0,
          borderStyle: "solid",
          background: activeView === view ? colors.blue : "white",
          "&: hover": {
            background: colors.blue,
            cursor: "pointer",
          },
          userSelect: "none",
          padding: 8,
        }}
        onClick={() => setActiveView(view)}
      >
        {children}
      </button>
    );
  };

  const views: { [key in View]: React.ReactNode } = {
    DoingNow: (
      <TextView
        log="DoingNow"
        textSubmissionPlaceholder="What are you doing now?"
      />
    ),
    Thoughts: (
      <TextView
        log="Thoughts"
        textSubmissionPlaceholder="What are you thinking about?"
      />
    ),
    Mood: <EmojiView log="Mood" />,
    Activity: <EmojiView log="Activity" />,
    Day: <DayView />,
    //    Search: <Search />,
  };

  return (
    <div
      css={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        css={{
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div
          css={{
            display: "flex",
            gap: 0,
            flexWrap: "wrap",
            padding: 0,
          }}
        >
          <ViewButton view="Day">Day</ViewButton>
          <ViewButton view="DoingNow">Doing Now</ViewButton>
          <ViewButton view="Thoughts">Thoughts</ViewButton>
          <ViewButton view="Mood">Mood</ViewButton>
          <ViewButton view="Activity">Activity</ViewButton>
        </div>
      </div>
      {views[activeView]}
    </div>
  );
}
