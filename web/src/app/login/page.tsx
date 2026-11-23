'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import NotifyFinLogo from '@/app/components/shared/NotifyFinLogo';
import { CustomizerContext } from '@/app/context/customizerContext';
import { useContext } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const { activeMode, toggleMode } = useContext(CustomizerContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setErrorMsg('E-mail ou senha inválidos. Verifique suas credenciais.');
        return;
      }
      const safeNext = nextPath.startsWith('/') ? nextPath : '/';
      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMsg('Erro ao conectar ao Supabase Auth. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 4,
        position: 'relative',
        background:
          activeMode === 'dark'
            ? 'radial-gradient(circle at top right, rgba(93,135,255,0.18), transparent 45%), #171c23'
            : 'radial-gradient(circle at top right, rgba(93,135,255,0.14), transparent 45%), radial-gradient(circle at bottom left, rgba(73,190,255,0.12), transparent 45%), #f6f9fc',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
        <IconButton onClick={toggleMode} aria-label="Alternar tema">
          {activeMode === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </IconButton>
      </Box>

      <Card
        elevation={9}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={3}>
            <Box display="flex" justifyContent="center">
              <NotifyFinLogo />
            </Box>

            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Acesso do Titular
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Entre com sua conta Supabase para consultar e classificar suas movimentações financeiras.
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" variant="outlined">
                {errorMsg}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.25}>
                <TextField
                  label="E-mail"
                  type="email"
                  required
                  fullWidth
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={18} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconLock size={18} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label="Mostrar senha"
                          >
                            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.35, fontWeight: 600 }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    'Entrar no NotifyFin'
                  )}
                </Button>
              </Stack>
            </Box>

            <Typography variant="caption" color="textSecondary" textAlign="center">
              Acesso protegido por Row-Level Security (RLS) no Supabase.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
