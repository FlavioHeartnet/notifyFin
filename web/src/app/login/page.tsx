'use client';
import React, { useContext, useState, Suspense } from 'react';
import Link from 'next/link';
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
  IconMoon,
  IconSparkles,
  IconSun,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import NotifyFinLogo from '@/app/components/shared/NotifyFinLogo';
import { CustomizerContext } from '@/app/context/customizerContext';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/';
  const authErrorParam = searchParams.get('error');
  const resetParam = searchParams.get('reset');
  const { activeMode, toggleMode } = useContext(CustomizerContext);

  const [mode, setMode] = useState<'password' | 'magic'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        setErrorMsg(
          'Não foi possível enviar o link mágico. Verifique se o e-mail é do Titular cadastrado e se a URL de redirecionamento está autorizada no Supabase.'
        );
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
          maxWidth: 430,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Box display="flex" justifyContent="center">
              <NotifyFinLogo />
            </Box>

            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Acesso do Titular
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Entre com senha ou receba um link mágico no seu e-mail.
              </Typography>
            </Box>

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
                minHeight: 42,
                '& .MuiTab-root': { minHeight: 42, fontWeight: 600 },
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
                label="Magic Link"
                icon={<IconSparkles size={16} />}
                iconPosition="start"
              />
            </Tabs>

            {errorMsg && (
              <Alert severity="error" variant="outlined">
                {errorMsg}
              </Alert>
            )}

            {successMsg && (
              <Alert severity="success" variant="outlined">
                {successMsg}
              </Alert>
            )}

            {mode === 'password' ? (
              <Box component="form" onSubmit={handlePasswordSubmit}>
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

                  <Box>
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
                    <Box textAlign="right" mt={0.75}>
                      <MuiLink
                        component={Link}
                        href="/esqueci-senha"
                        underline="hover"
                        variant="caption"
                        fontWeight={600}
                      >
                        Esqueci minha senha
                      </MuiLink>
                    </Box>
                  </Box>

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
            ) : (
              <Box component="form" onSubmit={handleMagicLinkSubmit}>
                <Stack spacing={2.25}>
                  <TextField
                    label="E-mail do Titular"
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

                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={loading}
                    startIcon={
                      loading ? undefined : <IconSparkles size={18} />
                    }
                    sx={{ py: 1.35, fontWeight: 600 }}
                  >
                    {loading ? (
                      <CircularProgress size={22} color="inherit" />
                    ) : (
                      'Enviar link mágico por e-mail'
                    )}
                  </Button>

                  <Typography
                    variant="caption"
                    color="textSecondary"
                    textAlign="center"
                  >
                    Você receberá um link único de acesso direto sem precisar digitar senha.
                  </Typography>
                </Stack>
              </Box>
            )}

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
