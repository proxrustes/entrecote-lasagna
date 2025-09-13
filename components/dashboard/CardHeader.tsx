"use client";
import * as React from "react";
import { Stack, Typography, IconButton, Tooltip, Chip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

type Props = {
  address: string;
  name: string;
  contractNumber: string;
};

export function CardHeader({ address, name, contractNumber }: Props) {
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contractNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1} alignItems="center">
        <HomeIcon sx={{ fontSize: 32 }} />
        <Typography variant="h6">
          My Home — {address},{name}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        {" "}
        <Typography variant="h5"># {contractNumber}</Typography>
        <Tooltip title={copied ? "Copied" : "Copy"}>
          <IconButton
            size="small"
            onClick={copy}
            aria-label="Copy contract number"
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );
}
