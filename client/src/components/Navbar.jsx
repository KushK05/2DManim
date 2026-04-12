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
        background: 'rgba(6, 8, 12, 0.86)',
        backdropFilter: 'blur(8px)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: 66, py: 1, gap: 2, flexWrap: 'wrap' }}>
          <Box
            onClick={() => navigate('/studio')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 17,
                height: 17,
                borderRadius: 999,
                background: 'linear-gradient(135deg, #f8fafc, #8ea0b8)',
              }}
            />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  lineHeight: 1.1,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontFamily: '"Space Grotesk", "IBM Plex Mono", sans-serif',
                }}
              >
                2DManim
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Animation studio
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap', ml: 1 }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    color: active ? 'text.primary' : 'text.secondary',
                    bgcolor: 'transparent',
                    minHeight: 30,
                    px: 1.25,
                    borderRadius: 1.5,
                    border: active ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
                    '&:hover': {
                      borderColor: 'rgba(255,255,255,0.12)',
                    },
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
                bgcolor: 'rgba(255,255,255,0.05)',
                color: 'text.primary',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            {user?.name && (
              <Chip
                label={user.name}
                sx={{ display: { xs: 'none', md: 'inline-flex' }, bgcolor: 'rgba(255,255,255,0.03)' }}
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
