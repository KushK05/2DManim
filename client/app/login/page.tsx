'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Stack, TextField } from '@mui/material';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      router.push('/studio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Login"
      title="Welcome back"
      subtitle="Sign in to open your animation studio, generation jobs, and saved history."
      footer={<>New to 2DManim? <Link href="/register">Create an account</Link></>}
    >
      <Stack component="form" spacing={2} onSubmit={submit}>
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth />
        <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required fullWidth />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </Stack>
    </AuthShell>
  );
}
