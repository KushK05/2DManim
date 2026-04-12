import { createTheme } from '@mui/material/styles';

const line = 'rgba(255,255,255,0.08)';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f8fafc',
      light: '#ffffff',
      dark: '#dbe2ea',
    },
    secondary: {
      main: '#8ea0b8',
      light: '#b5bfd2',
      dark: '#6f7c93',
    },
    info: {
      main: '#b5bfd2',
    },
    background: {
      default: '#06080c',
      paper: '#0e1117',
    },
    text: {
      primary: '#f4f4f5',
      secondary: '#8d99ae',
    },
    divider: line,
  },
  typography: {
    fontFamily: '"Space Grotesk", "IBM Plex Mono", sans-serif',
    h1: {
      fontSize: 'clamp(2rem, 5vw, 4rem)',
      lineHeight: 0.9,
      fontWeight: 700,
      letterSpacing: '-0.04em',
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3vw, 2.4rem)',
      lineHeight: 0.95,
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h3: {
      fontSize: 'clamp(1.1rem, 2.2vw, 1.6rem)',
      lineHeight: 1.05,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontSize: 'clamp(1rem, 2vw, 1.2rem)',
      fontWeight: 700,
      letterSpacing: '-0.02em',
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
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      fontSize: '0.68rem',
    },
    overline: {
      fontWeight: 600,
      letterSpacing: '0.08em',
      fontSize: '0.62rem',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at 10% 0%, rgba(255, 255, 255, 0.09), transparent 25%), radial-gradient(circle at 90% 5%, rgba(255, 255, 255, 0.07), transparent 25%), linear-gradient(180deg, #04070b 0%, #06080c 60%, #090d14 100%)',
          color: '#f4f4f5',
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
          textTransform: 'uppercase',
          fontWeight: 600,
          borderRadius: 9,
          paddingInline: 14,
          minHeight: 38,
        },
        contained: {
          border: '1px solid #e5e7eb',
          background: '#f8fafc',
          color: '#0a0a0a',
          boxShadow: 'none',
          '&:hover': {
            background: '#ffffff',
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: line,
          backgroundColor: 'rgba(255,255,255,0.02)',
          color: '#f4f4f5',
          '&:hover': {
            borderColor: line,
            backgroundColor: 'rgba(255,255,255,0.08)',
          },
        },
        text: {
          color: '#b5bfd2',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.06)',
            color: '#f8fafc',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          border: `1px solid ${line}`,
          backgroundColor: 'rgba(255,255,255,0.03)',
          color: '#dbe2ea',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'linear-gradient(180deg, rgba(17, 22, 32, 0.95), rgba(10, 13, 19, 0.95))',
          border: `1px solid ${line}`,
          boxShadow: 'none',
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${line}`,
          backgroundColor: '#0e1117',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(6, 8, 12, 0.86)',
          borderBottom: `1px solid ${line}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
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
          borderColor: line,
        },
        input: {
          paddingTop: 14,
          paddingBottom: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#8d99ae',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'linear-gradient(180deg, rgba(17, 22, 32, 0.98), rgba(10, 13, 19, 0.98))',
          border: `1px solid ${line}`,
          backdropFilter: 'blur(20px)',
        },
      },
    },
  },
});

export default theme;
