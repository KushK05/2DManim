import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Link, Alert,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/studio');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Start free"
      title="Create an account for sharper animation workflows."
      subtitle="Set up your workspace, test prompts quickly, and keep every generated scene accessible from one history feed."
      footer={(
        <>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" underline="hover" color="secondary.light">
            Sign in
          </Link>
          .
        </>
      )}
    >
      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Name"
          margin="normal"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="Email"
          type="email"
          margin="normal"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          margin="normal"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          helperText="Minimum 6 characters"
        />
        <Button
          fullWidth
          variant="contained"
          type="submit"
          size="large"
          sx={{ mt: 3 }}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </Box>
    </AuthShell>
  );
}
