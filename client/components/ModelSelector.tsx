'use client';

import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

type Model = {
  key: string;
  name?: string;
  provider?: string;
};

export default function ModelSelector({
  value,
  onChange,
  models,
}: {
  value: string;
  onChange: (value: string) => void;
  models: Model[];
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="model-label">Model</InputLabel>
      <Select
        labelId="model-label"
        label="Model"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {models.map((model) => (
          <MenuItem key={model.key} value={model.key}>
            {model.name || model.key}
            {model.provider ? ` · ${model.provider}` : ''}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
