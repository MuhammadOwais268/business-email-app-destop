import React, { useState } from 'react';
import WebhookSearch from './components/WebhookSearch';
import JsonTester from './components/JsonTester';
import EmailComposer from './components/EmailComposer';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: { main: '#0ea5a6' },
    secondary: { main: '#7c3aed' }
  },
  typography: { fontFamily: 'Inter, Arial, sans-serif' }
});

export default function App() {
  const [view, setView] = useState('search');
  const [emailInitialRecords, setEmailInitialRecords] = useState(null);

  const goToEmail = (records) => {
    setEmailInitialRecords(records || null);
    setView('email');
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="primary" elevation={3}>
          <Toolbar>
            <img src="../build/icon.svg" alt="logo" style={{ width: 36, marginRight: 12 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Business & Email
            </Typography>
            <Button color="inherit" onClick={() => setView('search')}>Search</Button>
            <Button color="inherit" onClick={() => setView('json')}>JSON Tester</Button>
            <Button color="inherit" onClick={() => setView('email')}>Email Composer</Button>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {view === 'search' && <WebhookSearch onProceedToEmail={goToEmail} />}
          {view === 'json' && <JsonTester onProceedToEmail={goToEmail} />}
          {view === 'email' && <EmailComposer initialRecords={emailInitialRecords} onBack={() => setView('search')} />}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
