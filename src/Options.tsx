import { useState, useEffect } from "react";
import type {
  DoingNow,
  MoodKind,
  Thoughts,
  Mood,
  Activity,
  ActivityKind,
  EmojiLog,
} from "../types/electron";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import type EmojiMart from "emoji-mart";

import "./index.css";

interface Emoji {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  emoticons: string[];
  shortcodes: string;
}

type OptionsView = "mood" | "activity";

function EmojiOptions({ log }: { log: EmojiLog }) {
  const [kinds, setKinds] = useState<MoodKind[] | ActivityKind[]>([]);
  const [selectedKind, setSelectedKind] = useState<MoodKind | ActivityKind>();
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  const [relabelText, setRelabelText] = useState("");

  useEffect(() => {
    const getKinds = async () => {
      const kinds = await window.electronAPI.getKinds(log);
      setKinds(kinds);
      if (kinds.length > 0) setSelectedKind(kinds[0]);
    };
    getKinds();
    const dataAsAny = data as any;
    const emojis = dataAsAny.emojis;
  }, []);

  const relabel = () => {
    if (selectedKind === undefined) return;
    window.electronAPI.relabelKind(log, selectedKind.code, relabelText);
    const newKinds = kinds.map((kind) => {
      return kind.code === selectedKind.code
        ? { ...kind, label: relabelText }
        : kind;
    });
    setSelectedKind({ ...selectedKind, label: relabelText });
    setKinds(newKinds);
  };

  const deleteKind = () => {
    // if there are any entries with this code, this will cause an error popup

    if (selectedKind === undefined) return;
    window.electronAPI.deleteKind(log, selectedKind.code);
    const newKinds = kinds.filter((kind) => {
      return kind.code !== selectedKind.code;
    });
    setKinds(newKinds);
    setSelectedKind(undefined);
  };

  const submitKind = (emoji: Emoji) => {
    // need to prevent this if the emoji is already in backend
    window.electronAPI.submitKind(log, emoji.unified, emoji.name);
    setKinds([
      ...kinds,
      { code: emoji.unified, label: emoji.name, hidden: false },
    ]);
  };

  const toggleVisibility = () => {
    if (selectedKind === undefined) return;
    window.electronAPI.toggleVisibilityKind(log, selectedKind.code);
    const newKinds = kinds.map((kind) =>
      kind.code === selectedKind.code ? { ...kind, hidden: !kind.hidden } : kind
    );
    setSelectedKind({ ...selectedKind, hidden: !selectedKind.hidden });
    setKinds(newKinds);
  };

  return (
    <div
      css={{
        margin: 4,
      }}
    >
      <div css={{ background: "rgba(0,0,0,0.0)" }}>
        <div css={{ padding: 4 }}>
          {kinds.map((kind, idx) => {
            const codePoints = kind.code
              .split("-")
              .map((hex) => parseInt(hex, 16));
            const emoji = String.fromCodePoint(...codePoints);

            return (
              <span
                key={idx}
                onClick={() => {
                  setSelectedKind(kind);
                }}
                css={{
                  fontSize: 40,
                  cursor: "pointer",
                  userSelect: "none",
                  background:
                    kind.code === selectedKind?.code
                      ? "rgba(0,0,0,0.5)"
                      : kind.hidden
                      ? "rgba(255,0,0,0.2)"
                      : "none",
                      padding:0
                }}
                role="img"
                aria-label="emoji"
              >
                {emoji}
              </span>
            );
          })}
        </div>
        {selectedKind && (
          <div
            css={{
              background: "rgba(0,0,0,0.0)",
              padding: 4,
              display: "flex",
            }}
          >
            <div css={{ margin: 4 }}>{selectedKind.label}</div>

            <input
              type="text"
              placeholder="relabel"
              value={relabelText}
              onChange={(event) => setRelabelText(event.target.value)}
            />
            <button onClick={relabel}>apply</button>
            <button onClick={toggleVisibility}>
              {selectedKind.hidden ? "unhide" : "hide"}
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    "Deleting this will also delete every entry of this kind"
                  )
                )
                  deleteKind();
              }}
            >
              bin
            </button>
          </div>
        )}
      </div>
      <div css={{ marginTop: 4 }}>
        <Picker data={data} onEmojiSelect={submitKind} />
      </div>
    </div>
  );
}

export default function Options() {
  const [activeOptionsView, setActiveOptionsView] =
    useState<OptionsView>("mood");

  return (
    <div css={{ display: "flex", height: "100vh" }}>
      <div
        css={{
          background: "rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: 4,
        }}
      >
        <button onClick={() => setActiveOptionsView("mood")}>Mood</button>
        <button onClick={() => setActiveOptionsView("activity")}>
          Activity
        </button>
      </div>
      {activeOptionsView === "mood" && <EmojiOptions log="Mood" />}
      {activeOptionsView === "activity" && <EmojiOptions log="Activity" />}
    </div>
  );
}
