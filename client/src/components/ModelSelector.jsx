import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

const FALLBACK_MODELS = [
  { key: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { key: 'gpt-4o', name: 'GPT-4o' },
  { key: 'gemini-pro', name: 'Gemini Pro' },
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
