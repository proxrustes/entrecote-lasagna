"use client";

import * as React from "react";
import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Link as MLink,
  Alert,
} from "@mui/material";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Введите почту и пароль");
      return;
    }

    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Неверная почта или пароль");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <Card sx={{ width: "100%", maxWidth: 440, boxShadow: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Welcome back!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Log in to RoofShare to see the strommeter details
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Почта"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  fullWidth
                />
                <TextField
                  label="Пароль"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                >
                  {loading ? "Входим…" : "Войти"}
                </Button>
              </Stack>
            </form>

            <Typography variant="body2" color="text.secondary">
              Нет аккаунта?{" "}
              <MLink component={Link} href="/signup">
                Зарегистрироваться
              </MLink>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
