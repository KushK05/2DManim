import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box, Stack, Typography } from '@mui/material';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Pricing from './pages/Pricing';

function LoadingScreen() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 420,
          p: 4,
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(16, 32, 45, 0.9), rgba(11, 23, 33, 0.94))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
          textAlign: 'center',
        }}
      >
        <Stack spacing={2} alignItems="center">
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(255, 138, 61, 0.12)',
              color: 'primary.main',
              border: '1px solid rgba(255, 138, 61, 0.22)',
            }}
          >
            <CircularProgress size={28} thickness={4} />
          </Box>
          <Typography variant="h5">Loading studio</Typography>
          <Typography variant="body2" color="text.secondary">
            Preparing your workspace, account state, and generation history.
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  const hideShell = location.pathname === '/' || location.pathname === '/pricing';

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {!hideShell && (
        <Box
          aria-hidden
          sx={{
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 18% 0%, rgba(255, 138, 61, 0.12), transparent 28%), radial-gradient(circle at 86% 12%, rgba(107, 231, 200, 0.1), transparent 22%)',
          }}
        />
      )}
      {user && !hideShell && <Navbar />}
      <Box component="main" sx={{ position: 'relative', zIndex: 1, pb: 5 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={user ? <Navigate to="/studio" /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/studio" /> : <Register />} />
          <Route path="/studio" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/billing" element={<Navigate to="/pricing" replace />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </Box>
  );
}
