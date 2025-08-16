import { useState, useEffect } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { logger } from "../env";
import type { LogEntry } from "../ConsoleLogger";

export default function LogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    setLogs(logger.getHistory());

    const unsubscribe = logger.subscribe((entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 500));
    });

    return () => unsubscribe();
  }, []);

  const getColor = (type: LogEntry["type"]) => {
    switch (type) {
      case "info":
        return "info.main";
      case "warn":
        return "warning.main";
      case "error":
        return "error.main";
      default:
        return "text.primary";
    }
  };

  return (
    <Box
    sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        boxSizing: "border-box",
    }}
    >
    <Paper
        sx={{
        p: 2,
        bgcolor: "grey.900",
        color: "grey.100",
        flexGrow: 1,
        width: "100%",
        fontFamily: "monospace",
        boxSizing: "border-box",
        borderRadius: 0,
        boxShadow: 0,
        }}
    >
        {logs.map((log, index) => (
        <Typography
            key={index}
            sx={{ color: getColor(log.type), whiteSpace: "pre-wrap" }}
        >
            {log.message}
        </Typography>
        ))}
    </Paper>
    </Box>
  );
}
