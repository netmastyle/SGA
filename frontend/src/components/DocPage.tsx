import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

interface DocPageProps {
  title: string;
  contentUrl: string;
}

export default function DocPage({ title, contentUrl }: DocPageProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(contentUrl)
      .then((r) => r.text())
      .then((text) => { setContent(text); setLoading(false); })
      .catch(() => { setContent('Error al cargar la documentación.'); setLoading(false); });
  }, [contentUrl]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          className="btn"
          style={{ padding: '6px 14px', fontSize: 13 }}
        >
          ← Volver
        </button>
        <h1 style={{ fontSize: 22, margin: 0 }}>{title}</h1>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
      ) : (
        <div className="doc-content">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
