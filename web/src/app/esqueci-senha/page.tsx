'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import { IconArrowLeft, IconMail } from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import AuthSplitLayout from '@/app/components/shared/AuthSplitLayout';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';

export default function EsqueciSenhaPage() {
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
            'Limite de envio de e-mails do Supabase atingido (429). Aguarde alguns minutos antes de solicitar outro link.'
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
    <AuthSplitLayout
      title="Esqueceu sua senha?"
      subtitle="Informe o e-mail do Titular cadastrado para receber o link de redefinição."
    >
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      {sent && (
        <Alert severity="success">
          Se o e-mail <strong>{email.trim()}</strong> estiver cadastrado, você
          receberá um link para criar uma nova senha.
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Box>
            <CustomFormLabel htmlFor="forgot-email">E-mail</CustomFormLabel>
            <TextField
              id="forgot-email"
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
            sx={{ py: 1.4 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              'Enviar link de recuperação'
            )}
          </Button>

          <Button
            component={Link}
            href="/login"
            variant="text"
            color="primary"
            size="large"
            fullWidth
            startIcon={<IconArrowLeft size={16} />}
          >
            Voltar para o login
          </Button>
        </Stack>
      </Box>
    </AuthSplitLayout>
  );
}
