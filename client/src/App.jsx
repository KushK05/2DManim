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
          borderRadius: 2.5,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(17, 22, 32, 0.95), rgba(10, 13, 19, 0.95))',
          boxShadow: 'none',
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
              bgcolor: 'rgba(255, 255, 255, 0.08)',
              color: 'text.primary',
              border: '1px solid rgba(255, 255, 255, 0.12)',
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
              'radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.09), transparent 24%), radial-gradient(circle at 90% 6%, rgba(255, 255, 255, 0.07), transparent 24%)',
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
