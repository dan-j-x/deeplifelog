import { useState, useEffect } from "react";
import { colors } from "./util";

export default function Pagination({
  numPages,
  getPage,
}: {
  numPages: number;
  getPage: (pageNum: number) => void;
}) {
  const [inputPage, setInputPage] = useState("");
  const [currentPage, setCurrentPage] = useState(numPages);

  useEffect(() => {
    setCurrentPage(numPages);
  }, [numPages]);

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  const ActionButton = ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => {
    return (
      <button
        css={{
          borderRadius: 0,
          borderWidth: 0,
          paddingTop: 4,
          paddingBottom: 4,
          "&: hover": { cursor: "pointer", background: colors.blue },
        }}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };

  const changePage = (pageNum: number) => {
    getPage(pageNum);
    setCurrentPage(pageNum);
    setInputPage(pageNum.toString());
  };

  const clamp = (num: number, min: number, max: number) => {
    return num <= min ? min : num >= max ? max : num;
  };

  return (
    <div>
      <ActionButton onClick={() => changePage(1)}>{"<<"}</ActionButton>
      <ActionButton
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {"<"}
      </ActionButton>
      <input
        type="text"
        value={inputPage === "0" ? "" : inputPage}
        onChange={(event) => {
          let value = event.target.value;
          value = value.replace(/[^0-9]/g, "");
          setInputPage(value);
        }}
        css={{
          borderRadius: 0,
          borderWidth: 0,
          width: 30,
          marginLeft: 2,
          marginRight: 2,
        }}
      />
      <ActionButton
        onClick={() => changePage(clamp(parseInt(inputPage), 1, numPages))}
      >
        Go
      </ActionButton>
      <ActionButton
        onClick={() => changePage(currentPage + 1)}
        disabled={currentPage === numPages}
      >
        {">"}
      </ActionButton>
      <ActionButton onClick={() => changePage(numPages)}>{">>"}</ActionButton>
    </div>
  );
}
