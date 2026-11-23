'use client';
import React, { useContext, useState } from 'react';
import Link from 'next/link';
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
  IconArrowLeft,
  IconMail,
  IconMoon,
  IconSun,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import NotifyFinLogo from '@/app/components/shared/NotifyFinLogo';
import { CustomizerContext } from '@/app/context/customizerContext';

export default function EsqueciSenhaPage() {
  const { activeMode, toggleMode } = useContext(CustomizerContext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSent(false);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );
      if (error) {
        if (
          error.status === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          error.message.toLowerCase().includes('rate limit')
        ) {
          setErrorMsg(
            'Limite de envio de e-mails do Supabase atingido (429). Aguarde alguns minutos antes de solicitar outro link ou configure um SMTP próprio no Supabase.'
          );
        } else {
          setErrorMsg(
            `Não foi possível enviar o e-mail de recuperação (${error.message}).`
          );
        }
        return;
      }
      setSent(true);
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

      <Card elevation={9} sx={{ width: '100%', maxWidth: 430, borderRadius: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack spacing={2.5}>
            <Box display="flex" justifyContent="center">
              <NotifyFinLogo />
            </Box>

            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Esqueci minha senha
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Informe seu e-mail cadastrado para receber o link de redefinição de senha.
              </Typography>
            </Box>

            {errorMsg && (
              <Alert severity="error" variant="outlined">
                {errorMsg}
              </Alert>
            )}

            {sent && (
              <Alert severity="success" variant="outlined">
                Se o e-mail <strong>{email.trim()}</strong> estiver cadastrado, você receberá um link para criar uma nova senha.
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
                    'Enviar link de recuperação'
                  )}
                </Button>
              </Stack>
            </Box>

            <Button
              component={Link}
              href="/login"
              variant="text"
              color="inherit"
              fullWidth
              startIcon={<IconArrowLeft size={16} />}
            >
              Voltar para o login
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
