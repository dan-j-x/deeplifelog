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
import { colors } from "./util";

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

type OptionsView = "Mood" | "Activity";

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
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flexGrow: 1,
      }}
    >
      <div css={{ width: "100%" }}>
        <div css={{ margin: 4, fontSize: 20, textDecoration: "underline" }}>
          Currently available
        </div>
        <div css={{ background: colors.gray }}>
          <div
            css={{
              padding: 4,
              boxSizing: "border-box",
              display: "flex",
              flexWrap: "wrap",
              gap: 0,
              borderStyle: "solid",
              borderWidth: 0,
              borderRadius: 0,
              width: "100%",
              background: "rgba(0,0,0,0.0)",
            }}
          >
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
                    fontSize: 32,
                    cursor: "pointer",
                    userSelect: "none",
                    background:
                      kind.code === selectedKind?.code
                        ? "rgba(0,0,0,0.2)"
                        : kind.hidden
                        ? "rgba(255,0,0,0.2)"
                        : "none",
                    padding: 2,
                    borderRadius: "50%",
                    "&: hover": {},
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
            <div css={{ width: "100%", marginTop: 0 }}>
              <div css={{ margin: 4, fontSize: 16 }}>
                Selected label:{" "}
                <span css={{ fontWeight: "bold" }}>{selectedKind.label}</span>
              </div>
              <div
                css={{
                  background: "rgba(0,0,0,0.0)",
                  padding: 4,
                  borderRadius: 0,
                  display: "flex",
                  gap: 4,
                }}
              >
                <div>
                  <input
                    type="text"
                    placeholder="relabel"
                    value={relabelText}
                    onChange={(event) => setRelabelText(event.target.value)}
                    css={{
                      borderWidth: 0,
                      height: 20,
                      borderRadius: 0,
                      padding: 4,
                    }}
                  />
                  <button
                    css={{
                      borderWidth: 0,
                      height: "100%",
                      boxSizing: "border-box",
                      background: colors.blue,
                      ":enabled": { cursor: "pointer" },
                    }}
                    onClick={relabel}
                    disabled={relabelText.length === 0}
                  >
                    Apply
                  </button>
                </div>
                <button
                  css={{
                    borderWidth: 0,
                    background: colors.blue,
                    cursor: "pointer",
                  }}
                  onClick={toggleVisibility}
                >
                  {selectedKind.hidden ? "Unhide" : "Hide"}
                </button>
                <button
                  css={{
                    borderWidth: 0,
                    background: colors.blue,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    if (
                      confirm(
                        "Deleting this will also delete every entry of this kind"
                      )
                    )
                      deleteKind();
                  }}
                >
                  Bin
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          css={{
            fontSize: 20,
            margin: 4,
            textDecoration: "underline",
          }}
        >
          Add emoji
        </div>
      </div>
      <div
        css={{
          width: "100%",
          background: colors.gray,
          display: "flex",
          justifyContent: "center",
          padding: 4,
          boxSizing: "border-box",
          borderRadius: 0,
        }}
      >
        <Picker data={data} onEmojiSelect={submitKind} />
      </div>
    </div>
  );
}

export default function Options() {
  const [activeOptionsView, setActiveOptionsView] =
    useState<OptionsView>("Mood");

  const OptionsButton = ({
    children,
    onClick,
    view,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    view: OptionsView;
  }) => {
    return (
      <button
        css={{
          borderWidth: 0,
          padding: 0,
          background: "none",
          color: activeOptionsView === view ? "blue" : "inherit",
          fontWeight: "bold",
          textAlign: "left",
          textDecoration: "underline",
          "&:hover": {
            color: activeOptionsView === view ? "blue" : "gray",
            cursor: "pointer",
          },
          fontSize: 20,
          outline: "none",
        }}
        onClick={() => setActiveOptionsView(view)}
      >
        {children}
      </button>
    );
  };

  return (
    <div css={{ display: "flex", minHeight: "100vh" }}>
      <div
        css={{
          background: "rgba(0,0,0,0.0)",
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: 4,
        }}
      >
        <OptionsButton view="Mood">Mood</OptionsButton>
        <OptionsButton view="Activity">Activity</OptionsButton>
      </div>
      {activeOptionsView === "Mood" && <EmojiOptions log="Mood" />}
      {activeOptionsView === "Activity" && <EmojiOptions log="Activity" />}
    </div>
  );
}
