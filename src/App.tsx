import { useState, useEffect } from "react";
import type { API } from "../types/electron";
import Logger from "./Logger";

declare global {
  interface Window {
    electronAPI: API;
  }
}

function App() {
  return <Logger />;
}

export default App;
