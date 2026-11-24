'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material';
import {
  IconArrowLeft,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconLock,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/client';
import AuthSplitLayout from '@/app/components/shared/AuthSplitLayout';
import CustomFormLabel from '@/app/components/forms/theme-elements/CustomFormLabel';

export default function RedefinirSenhaPage() {
  const router = useRouter();

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
    <AuthSplitLayout
      title="Criar nova senha"
      subtitle="Defina uma nova senha de acesso para a sua conta NotifyFin."
    >
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      {done && (
        <Alert severity="success">
          Senha atualizada com sucesso! Redirecionando para o painel...
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <Box>
            <CustomFormLabel htmlFor="new-password">Nova senha</CustomFormLabel>
            <TextField
              id="new-password"
              type={showPassword ? 'text' : 'password'}
              required
              fullWidth
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Mínimo de 8 caracteres"
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

          <Box>
            <CustomFormLabel htmlFor="confirm-password">
              Confirmar nova senha
            </CustomFormLabel>
            <TextField
              id="confirm-password"
              type={showPassword ? 'text' : 'password'}
              required
              fullWidth
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
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
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            disabled={loading || done}
            startIcon={loading ? undefined : <IconCheck size={18} />}
            sx={{ py: 1.4 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              'Salvar nova senha'
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
