import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const FALLBACK_MODELS = [
  { key: 'mistral-medium-latest', name: 'Mistral Medium Latest' },
  { key: 'mistral-small-latest', name: 'Mistral Small Latest' },
  { key: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { key: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite' },
];

export default function ModelSelector({ value, onChange, models = [] }) {
  const options = models.length > 0 ? models : FALLBACK_MODELS;

  return (
    <FormControl fullWidth>
      <InputLabel>AI Model</InputLabel>
      <Select value={value} onChange={(e) => onChange(e.target.value)} label="AI Model">
        {options.map((m) => (
          <MenuItem key={m.key} value={m.key}>
            {m.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
