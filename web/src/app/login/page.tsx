'use client';
import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconSparkles,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import AuthSplitLayout from '@/app/components/shared/AuthSplitLayout';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const authErrorParam = searchParams.get('error');
  const resetParam = searchParams.get('reset');

  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    authErrorParam === 'auth_callback_error'
      ? 'O link de acesso expirou ou é inválido. Solicite um novo link.'
      : null
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(
    resetParam === 'success'
      ? 'Senha redefinida com sucesso! Você já pode entrar com a nova senha.'
      : null
  );

  const safeNext =
    nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
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
      router.push(safeNext);
      router.refresh();
    } catch {
      setErrorMsg('Erro ao conectar ao Supabase Auth. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        safeNext
      )}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        if (
          error.status === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          error.message.toLowerCase().includes('rate limit')
        ) {
          setErrorMsg(
            'Limite de envio de e-mails do Supabase atingido (429). Aguarde alguns minutos ou entre pela aba "Senha".'
          );
        } else {
          setErrorMsg(
            `Não foi possível enviar o link mágico (${error.message}). Verifique se o e-mail é do Titular cadastrado.`
          );
        }
        return;
      }
      setSuccessMsg(
        `Enviamos um link de acesso para ${email.trim()}. Abra sua caixa de entrada e clique no link para entrar.`
      );
    } catch {
      setErrorMsg('Erro ao solicitar o link mágico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      title="Bem-vindo ao NotifyFin"
      subtitle="Seu painel de monitoramento financeiro pessoal"
    >
      <Tabs
        value={mode}
        onChange={(_, v) => {
          setMode(v);
          setErrorMsg(null);
          setSuccessMsg(null);
        }}
        variant="fullWidth"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tab
          value="password"
          label="Senha"
          icon={<IconLock size={16} />}
          iconPosition="start"
        />
        <Tab
          value="magic"
          label="Link Mágico"
          icon={<IconSparkles size={16} />}
          iconPosition="start"
        />
      </Tabs>

      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {successMsg && <Alert severity="success">{successMsg}</Alert>}

      {mode === 'password' ? (
        <Box component="form" onSubmit={handlePasswordSubmit}>
          <Stack spacing={2.5}>
            <Box>
              <CustomFormLabel htmlFor="login-email">E-mail</CustomFormLabel>
              <TextField
                id="login-email"
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
            </Box>

            <Box>
              <CustomFormLabel htmlFor="login-password">Senha</CustomFormLabel>
              <TextField
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                fullWidth
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
                          {showPassword ? (
                            <IconEyeOff size={18} />
                          ) : (
                            <IconEye size={18} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ my: -0.5 }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" color="text.primary">
                    Lembrar este dispositivo
                  </Typography>
                }
              />
              <MuiLink
                component={Link}
                href="/esqueci-senha"
                underline="hover"
                variant="body2"
                fontWeight={600}
                color="primary.main"
              >
                Esqueci minha senha?
              </MuiLink>
            </Stack>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ py: 1.4, fontSize: '0.9375rem' }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Entrar'
              )}
            </Button>
          </Stack>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleMagicLinkSubmit}>
          <Stack spacing={2.5}>
            <Box>
              <CustomFormLabel htmlFor="magic-email">
                E-mail do Titular
              </CustomFormLabel>
              <TextField
                id="magic-email"
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
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={loading ? undefined : <IconSparkles size={18} />}
              sx={{ py: 1.4, fontSize: '0.9375rem' }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Enviar link mágico por e-mail'
              )}
            </Button>

            <Typography variant="caption" color="text.secondary" textAlign="center">
              Você receberá um link único de acesso direto sem precisar digitar senha.
            </Typography>
          </Stack>
        </Box>
      )}
    </AuthSplitLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
