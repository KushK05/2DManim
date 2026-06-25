'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Stack, TextField } from '@mui/material';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/components/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      router.push('/studio');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create account"
      title="Start creating"
      subtitle="Create a local account and begin turning prompts into queued Manim generation jobs."
      footer={<>Already have an account? <Link href="/login">Sign in</Link></>}
    >
      <Stack component="form" spacing={2} onSubmit={submit}>
        <TextField label="Name" value={name} onChange={(event) => setName(event.target.value)} required fullWidth />
        <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth />
        <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required fullWidth />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? 'Creating...' : 'Create account'}
        </Button>
      </Stack>
    </AuthShell>
  );
}
