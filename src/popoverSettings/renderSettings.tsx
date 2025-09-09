import { CssBaseline } from "@mui/material";
import OBR from "@owlbear-rodeo/sdk";
import React from "react";
import ReactDOM from "react-dom/client";
import { Settings } from "./Settings";

document.addEventListener("DOMContentLoaded", () => {
    const root = ReactDOM.createRoot(document.getElementById("reactApp")!);
    OBR.onReady(() => {
        root.render(
            <React.StrictMode>
                <CssBaseline />
                <Settings />
            </React.StrictMode>,
        );
    });
});
