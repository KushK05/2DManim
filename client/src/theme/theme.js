import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff8a3d',
      light: '#ffb070',
      dark: '#db6720',
    },
    secondary: {
      main: '#6be7c8',
      light: '#a1f3de',
      dark: '#2bb796',
    },
    info: {
      main: '#68b7ff',
    },
    background: {
      default: '#07111a',
      paper: '#10202d',
    },
    text: {
      primary: '#f8f3ee',
      secondary: 'rgba(248, 243, 238, 0.72)',
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Avenir Next", "Segoe UI", sans-serif',
    h1: {
      fontSize: 'clamp(3rem, 5vw, 4.8rem)',
      lineHeight: 0.98,
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontSize: 'clamp(2.3rem, 4vw, 3.6rem)',
      lineHeight: 1,
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h3: {
      fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
      lineHeight: 1.05,
      fontWeight: 700,
      letterSpacing: '-0.035em',
    },
    h4: {
      fontSize: 'clamp(1.6rem, 2.5vw, 2.1rem)',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.08em',
    },
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#07111a',
        },
      },
    },
    MuiContainer: {
      defaultProps: {
        maxWidth: 'xl',
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 999,
          paddingInline: 20,
          minHeight: 46,
        },
        contained: {
          background: 'linear-gradient(135deg, #ff8a3d 0%, #ff6b3d 100%)',
          boxShadow: '0 14px 30px rgba(255, 107, 61, 0.28)',
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(255,255,255,0.02)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(180deg, rgba(16, 32, 45, 0.9), rgba(11, 23, 33, 0.92))',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
          backdropFilter: 'blur(18px)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 22,
          background: 'rgba(255,255,255,0.03)',
          transition: 'background 160ms ease, transform 160ms ease',
          '&:hover': {
            background: 'rgba(255,255,255,0.04)',
          },
          '&.Mui-focused': {
            background: 'rgba(255,255,255,0.055)',
          },
        },
        notchedOutline: {
          borderColor: 'rgba(255,255,255,0.1)',
        },
        input: {
          paddingTop: 16,
          paddingBottom: 16,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(248, 243, 238, 0.72)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, rgba(16, 32, 45, 0.98), rgba(11, 23, 33, 0.98))',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        },
      },
    },
  },
});

export default theme;
