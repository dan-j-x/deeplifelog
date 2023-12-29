import { useState, useEffect } from "react";
import type { API } from "../types/electron";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import Logger from "./Logger";
import Counsel from "./Counsel";

declare global {
  interface Window {
    electronAPI: API;
  }
}

function App() {
  return <Logger />;
  {
    /* <PanelGroup autoSaveId="example" direction="horizontal">
      <Panel id="logger" order={1} defaultSizePercentage={100}>
        <Logger />
      </Panel>
       <PanelResizeHandle style={{ width: "5px", backgroundColor: "grey" }} />
      <Panel id="council" order={2} defaultSizePercentage={50}>
        <Counsel />
      </Panel> 
    </PanelGroup> */
  }
}

export default App;
