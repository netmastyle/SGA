import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiClient } from '../api/client';
import type { ApiResponse } from '../api/types';

interface HealthInfo {
  status: string;
  service: string;
  version: string;
}

const clientVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

export default function VersionInfo({ compact = false }: { compact?: boolean }) {
  const [apiVersion, setApiVersion] = useState<string>('…');

  useEffect(() => {
    apiClient
      .get<ApiResponse<HealthInfo>>('/health')
      .then((res) => setApiVersion(res.data.data?.version ?? '?'))
      .catch(() => setApiVersion('n/d'));
  }, []);

  const style: CSSProperties = compact
    ? { fontSize: 11, color: 'var(--color-text-muted)', marginTop: 12, lineHeight: 1.4 }
    : {
        fontSize: 11,
        color: 'var(--color-text-muted)',
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 1.4,
      };

  return (
    <div style={style} title="Versiones de cliente y API">
      <div>Cliente v{clientVersion}</div>
      <div>API v{apiVersion}</div>
    </div>
  );
}
