import React from 'react';
import { getStatusInfo } from '../utils/formatters';

export default function Badge({ status, text }) {
  const info = getStatusInfo(status);
  const displayText = text || info.label;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: info.bg,
        color: info.text,
        border: `1px solid ${info.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      <span>{info.icon}</span>
      <span>{displayText}</span>
    </span>
  );
}
