import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  Container,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Studio', path: '/studio' },
    { label: 'History', path: '/history' },
    { label: 'Pricing', path: '/pricing' },
  ];

  return (
    <AppBar
      position="sticky"
      sx={{
        top: 0,
        background: 'rgba(7, 17, 26, 0.72)',
        backdropFilter: 'blur(18px)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 84, py: 1.5, gap: 2, flexWrap: 'wrap' }}>
          <Box
            onClick={() => navigate('/studio')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '16px',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                color: 'primary.main',
                background: 'linear-gradient(135deg, rgba(255, 138, 61, 0.18), rgba(107, 231, 200, 0.1))',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              2D
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.1 }}>
                2DManim
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Animation studio
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  variant={active ? 'contained' : 'text'}
                  sx={{
                    color: active ? 'common.white' : 'text.secondary',
                    bgcolor: active ? undefined : 'transparent',
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Chip label={`${user?.credits ?? 0} credits`} variant="outlined" />
            <Chip
              label={`${(user?.plan || 'free').toUpperCase()} plan`}
              sx={{
                bgcolor: 'rgba(107, 231, 200, 0.12)',
                color: 'secondary.light',
                border: '1px solid rgba(107, 231, 200, 0.22)',
              }}
            />
            {user?.name && (
              <Chip
                label={user.name}
                sx={{ display: { xs: 'none', md: 'inline-flex' }, bgcolor: 'rgba(255,255,255,0.06)' }}
              />
            )}
            <Button
              variant="outlined"
              color="inherit"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
