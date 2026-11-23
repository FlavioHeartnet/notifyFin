'use client';
import React, { useContext, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import NotifyFinLogo from '@/app/components/shared/NotifyFinLogo';
import { CustomizerContext } from '@/app/context/customizerContext';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { activeMode, toggleMode } = useContext(CustomizerContext);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não conferem.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(
          'Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo link em "Esqueci minha senha".'
        );
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1200);
    } catch {
      setErrorMsg('Erro ao atualizar senha. Tente novamente.');
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

      <Card elevation={9} sx={{ width: '100%', maxWidth: 430, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Box display="flex" justifyContent="center">
              <NotifyFinLogo />
            </Box>

            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Criar nova senha
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Defina uma nova senha de acesso para a sua conta NotifyFin.
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" variant="outlined">
                {errorMsg}
              </Alert>
            )}

            {done && (
              <Alert severity="success" variant="outlined">
                Senha atualizada com sucesso! Redirecionando para o painel...
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.25}>
                <TextField
                  label="Nova senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Mínimo de 8 caracteres"
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

                <TextField
                  label="Confirmar nova senha"
                  type={showPassword ? 'text' : 'password'}
                  required
                  fullWidth
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconLock size={18} />
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
                  disabled={loading || done}
                  startIcon={loading ? undefined : <IconCheck size={18} />}
                  sx={{ py: 1.35, fontWeight: 600 }}
                >
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    'Salvar nova senha'
                  )}
                </Button>
              </Stack>
            </Box>

            <Button component={Link} href="/login" variant="text" color="inherit" fullWidth>
              Voltar para o login
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
