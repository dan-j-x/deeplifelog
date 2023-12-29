import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  Ref,
} from "react";
import { DaySummary, DayRatingKind, DayRating } from "../types/electron";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import { colors } from "./util";
import Pagination from "./Pagination";
import "react-datepicker/dist/react-datepicker.css";

const DayInputView = ({
  summary,
  exit,
}: {
  summary: DaySummary;
  exit: () => void;
}) => {
  const [text, setText] = useState("");
  const [ratings, setRatings] = useState<DayRating[]>([]);

  useEffect(() => {
    setRatings(summary.ratings);
    setText(summary.day.content);
  }, [summary]);

  const submit = () => {
    const newSummary: DaySummary = {
      day: { date: summary.day.date, content: text },
      ratings: ratings,
    };
    window.electronAPI.submitDaySummary(newSummary);

    exit();
  };

  const MagSelect = ({ rating }: { rating: DayRating }) => {
    const [mouseOverBox, setMouseOverBox] = useState(-1);

    const handleMouse = (idx: number) => {
      setMouseOverBox(idx);
    };

    const selectRating = (magnitude: number) => {
      const newRatings = ratings.map((_rating) =>
        _rating.kind === rating.kind
          ? { ..._rating, magnitude: magnitude }
          : _rating
      );
      setRatings(newRatings);
    };

    return (
      <div css={{ display: "flex" }}>
        {[...Array(10)].map((_, idx) => (
          <div
            key={idx}
            onMouseEnter={() => handleMouse(idx)}
            onMouseLeave={() => handleMouse(-1)}
            onClick={() => selectRating(idx + 1)}
            css={{
              width: 30,
              height: 30,
              background:
                mouseOverBox >= idx || rating.magnitude! > idx
                  ? colors.grass
                  : "rgba(0,0,0,0.1)",
              borderStyle: "solid",
              borderWidth: 0,
              borderRadius: 2,
              margin: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            {mouseOverBox === idx || rating.magnitude === idx + 1
              ? idx + 1
              : null}
          </div>
        ))}
      </div>
    );
  };

  const ActionButton = ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
  }) => {
    return (
      <button
        css={{
          padding: 8,
          borderRadius: 0,
          borderStyle: "solid",
          borderWidth: 0,
          "&:enabled:hover": { cursor: "pointer", background: colors.blue },
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  return (
    <div
      css={{
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        height: "100%",
      }}
    >
      <textarea
        css={{
          height: 100,
          resize: "none",
          borderRadius: 0,
          padding: 4,
          borderWidth: 0,
          background: colors.yellow,
          ":focus": { outline: "none" },
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Say something about the day"
      ></textarea>
      <div
        css={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <div
          css={{
            display: "flex",
            flexDirection: "column",
            padding: 4,

            alignItems: "center",
          }}
        >
          {ratings.map((rating, idx) => (
            <div css={{}} key={idx}>
              {rating.kind}
              <MagSelect rating={rating} />
            </div>
          ))}
        </div>
      </div>
      <div
        css={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <ActionButton onClick={exit}>Exit</ActionButton>
        <ActionButton
          onClick={() => submit()}
          disabled={!ratings.every((rating) => rating.magnitude > 0)}
        >
          Save
        </ActionButton>
      </div>
    </div>
  );
};

export default function DayView() {
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<DaySummary>();
  const [ratingKinds, setRatingKinds] = useState<DayRatingKind[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [numPages, setNumPages] = useState(0);
  const [ratingColors, setRatingColors] = useState<Record<string, string>>({
    Productive: "#bbe630",
    Happy: "#fff719",
    Interesting: "#74cedb",
    Difficult: "#d4816a",
  });
  const [showInfo, setShowInfo] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  const getPage = async (pageNum: number) => {
    const summaries = (await window.electronAPI.getPage(
      "Day",
      pageNum
    )) as DaySummary[];
    setSummaries(summaries);
    //setSelectedSummary(summaries[0]);
  };

  const getSummaries = async () => {
    const numPages = await window.electronAPI.getNumPages("Day");
    setNumPages(numPages);
    getPage(numPages);
  };

  useEffect(() => {
    const getRatingKinds = async () => {
      const ratingKinds = await window.electronAPI.getDayRatingKinds();
      setRatingKinds(ratingKinds);
    };
    getRatingKinds();
    getSummaries();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [summaries]);

  const InfoView = () => {
    return (
      <div
        css={{
          background: "rgba(0,0,0,0.2)",
          display: "flex",
          gap: 4,
          padding: 4,
        }}
      >
        {Object.entries(ratingColors).map(([kind, color], idx) => (
          <div
            css={{ padding: 4, background: color, borderRadius: 1 }}
            key={idx}
          >
            {kind}
          </div>
        ))}
      </div>
    );
  };

  const SummaryView = ({ summary }: { summary: DaySummary }) => {
    const [mouseOver, setMouseOver] = useState(false);

    const deleteSummary = () => {
      window.electronAPI.deleteDaySummary(summary.day.date);
      getSummaries();
    };

    return (
      <div
        css={{
          "&:hover": {
            background: "rgba(0,0,0,0.1)",
          },
          paddingLeft: 4,
        }}
        onMouseEnter={() => setMouseOver(true)}
        onMouseLeave={() => setMouseOver(false)}
      >
        <div
          css={{
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div
            css={{
              display: "flex",
              flexDirection: "row",
              gap: 4,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            <div>
              {"["}
              <span css={{ fontStyle: "italic" }}>{summary.day.date}</span>
              {"] "}
            </div>
            <div
              css={{
                display: "flex",
                flexDirection: "row",
                gap: 4,
                paddingRight: 4,
              }}
            >
              {summary.ratings.map((rating, idx) => {
                return (
                  <div
                    key={idx}
                    css={{
                      background: ratingColors[rating.kind] ?? "#000000",
                      paddingLeft: 6,
                      paddingRight: 6,
                      //color: "white",
                      borderRadius: 1,
                    }}
                  >
                    {rating.magnitude}
                  </div>
                );
              })}
            </div>
          </div>

          <div css={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div
              css={{
                "&:hover": { background: colors.blue, cursor: "pointer" },
                paddingLeft: 4,
                paddingRight: 4,
                display: "flex",
                alignItems: "center",
                height: "100%",
                visibility: mouseOver ? "visible" : "hidden",
              }}
              onClick={() => setSelectedSummary(summary)}
            >
              <svg
                fill="none"
                height="12"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="12"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>

            <button
              css={{
                height: "100%",
                background: "none",
                borderWidth: 0,
                borderStyle: "solid",
                visibility: mouseOver === true ? "visible" : "hidden",
                "&: hover": { cursor: "pointer", background: colors.blue },
                userSelect: "none",
              }}
              onClick={(event) => {
                if (confirm("Delete entry")) deleteSummary();
                event.stopPropagation();
              }}
            >
              x
            </button>
          </div>
        </div>
        <div css={{ paddingRight: 4 }}>{summary.day.content}</div>
      </div>
    );
  };

  const CalendarInput = forwardRef(
    (
      { value, onClick }: { value?: string; onClick?: () => void },
      ref: Ref<HTMLButtonElement>
    ) => (
      <button
        css={{
          padding: 8,
          borderWidth: 0,
          "&:hover": { background: colors.blue, cursor: "pointer" },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 4,
          background:'white'
        }}
        onClick={onClick}
        ref={ref}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          width="16"
          height="16"
        >
          <path d="M96 32V64H48C21.5 64 0 85.5 0 112v48H448V112c0-26.5-21.5-48-48-48H352V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V64H160V32c0-17.7-14.3-32-32-32S96 14.3 96 32zM448 192H0V464c0 26.5 21.5 48 48 48H400c26.5 0 48-21.5 48-48V192z"></path>
        </svg>

        {value}
      </button>
    )
  );
  return (
    <>
      {selectedSummary === undefined ? (
        <>
          <div
            css={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Pagination numPages={numPages} getPage={getPage} />
            <div
              css={{
                display: "flex",
                alignItems: "center",
                "&:hover": { background: colors.blue, cursor: "pointer" },
                background: showInfo ? colors.blue : "none",
              }}
              onClick={() => setShowInfo(!showInfo)}
            >
              <svg
                height="22"
                viewBox="0 0 48 48"
                width="22"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M0 0h48v48h-48z" fill="none" />
                <path d="M22 34h4v-12h-4v12zm2-30c-11.05 0-20 8.95-20 20s8.95 20 20 20 20-8.95 20-20-8.95-20-20-20zm0 36c-8.82 0-16-7.18-16-16s7.18-16 16-16 16 7.18 16 16-7.18 16-16 16zm-2-22h4v-4h-4v4z" />
              </svg>
            </div>
          </div>
          {showInfo && <InfoView />}
          <div
            ref={logRef}
            css={{
              overflowY: "auto",
              flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {summaries.map((summary, idx) => (
              <SummaryView summary={summary} key={idx} />
            ))}
          </div>
          <div
            css={{
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            <button
              css={{
                padding: 8,
                
                borderRadius: 0,
                borderWidth: 0,
                borderStyle: "solid",
                "&: hover": { background: colors.blue, cursor: "pointer" },
                background:'white'
              }}
              onClick={() =>
                setSelectedSummary({
                  day: { date: format(startDate, "yyyy-MM-dd"), content: "" },
                  ratings: ratingKinds.map((ratingKind) => ({
                    date: format(startDate, "yyyy-MM-dd"),
                    kind: ratingKind.kind,
                    magnitude: 0,
                  })),
                })
              }
            >
              Add Summary
            </button>
            <DatePicker
              customInput={<CalendarInput />}
              selected={startDate}
              onChange={(date) => {
                if (date !== null) setStartDate(date);
              }}
            />
          </div>
        </>
      ) : (
        <DayInputView
          summary={selectedSummary}
          exit={() => {
            getSummaries();
            setSelectedSummary(undefined);
          }}
        />
      )}
    </>
  );
}
