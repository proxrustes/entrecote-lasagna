"use client";
import * as React from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import { usePathname } from "next/navigation";
import Grid3x3RoundedIcon from "@mui/icons-material/Grid3x3Rounded";
import { signOut, useSession } from "next-auth/react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", roles: ["landlord", "tenant"] },
  { href: "/billing", label: "Billing", roles: ["landlord", "tenant"] },
  { href: "/devices", label: "Devices", roles: ["landlord"] },
  { href: "/providers", label: "Providers", roles: ["landlord"] },
  { href: "/settings", label: "Settings", roles: ["landlord", "tenant"] },
];

export function Header() {
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleMenu = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const { data: session } = useSession();
  const role = (session as any)?.role;
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 1, minHeight: 72 }}>
        <Grid3x3RoundedIcon color="primary" />
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>
          RoofShare
        </Typography>
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          {NAV.filter((item) => item.roles.includes(role)).map((i) => (
            <Button
              key={i.href}
              component={Link}
              href={i.href}
              variant={pathname?.startsWith(i.href) ? "contained" : "text"}
              color={pathname?.startsWith(i.href) ? "primary" : undefined}
            >
              {i.label}
            </Button>
          ))}
        </Box>
        <Box>
          <IconButton onClick={handleMenu} size="small">
            <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            keepMounted
          >
            <MenuItem onClick={() => signOut({ callbackUrl: "/" })}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
