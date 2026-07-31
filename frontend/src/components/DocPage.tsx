import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface Heading {
  level: number;
  text: string;
  id: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n');
  const headings: Heading[] = [];
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      const text = match[2].trim();
      headings.push({ level: match[1].length, text, id: slugify(text) });
    }
  }
  return headings;
}

interface DocPageProps {
  title: string;
  contentUrl: string;
}

export default function DocPage({ title, contentUrl }: DocPageProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');
  const [search, setSearch] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    setSearch('');
    setActiveId('');
    fetch(contentUrl)
      .then((r) => r.text())
      .then((text) => {
        setContent(text);
        setHeadings(extractHeadings(text));
        setLoading(false);
      })
      .catch(() => {
        setContent('Error al cargar la documentación.');
        setLoading(false);
      });
  }, [contentUrl]);

  const filteredHeadings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return headings;
    return headings.filter((h) => h.text.toLowerCase().includes(q));
  }, [headings, search]);

  useEffect(() => {
    const panel = contentRef.current;
    if (!panel || loading) return;

    const onScroll = () => {
      const anchors = panel.querySelectorAll<HTMLElement>('[data-doc-id]');
      const panelTop = panel.getBoundingClientRect().top;
      let current = '';
      anchors.forEach((node) => {
        if (node.getBoundingClientRect().top - panelTop <= 24) {
          current = node.getAttribute('data-doc-id') ?? '';
        }
      });
      setActiveId(current);
    };

    panel.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => panel.removeEventListener('scroll', onScroll);
  }, [loading, content]);

  function scrollTo(id: string) {
    const panel = contentRef.current;
    const el = panel?.querySelector<HTMLElement>(`[data-doc-id="${id}"]`);
    if (panel && el) {
      panel.scrollTo({ top: el.offsetTop - 12, behavior: 'smooth' });
      setActiveId(id);
    }
  }

  const components: Components = {
    h1: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h1 data-doc-id={id} style={{ scrollMarginTop: 16 }}>
          {children}
        </h1>
      );
    },
    h2: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h2 data-doc-id={id} style={{ scrollMarginTop: 16 }}>
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h3 data-doc-id={id} style={{ scrollMarginTop: 16 }}>
          {children}
        </h3>
      );
    },
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        height: 'calc(100vh - 64px)',
        margin: -32,
        overflow: 'hidden',
      }}
    >
      {/* TOC — fixed panel, does not scroll with content */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-bg-elevated)',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '16px 14px 12px', flexShrink: 0 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn"
            style={{ padding: '6px 14px', fontSize: 13, width: '100%', marginBottom: 14 }}
          >
            ← Volver
          </button>

          <p
            style={{
              fontSize: 11,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Contenido
          </p>

          <input
            className="input"
            type="search"
            placeholder="Buscar sección…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', fontSize: 13, padding: '7px 10px' }}
          />
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '0 10px 16px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {filteredHeadings.length === 0 && !loading && (
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '8px 4px' }}>
              Sin resultados
            </p>
          )}
          {filteredHeadings.map((h) => (
            <button
              key={h.id + h.text}
              onClick={() => scrollTo(h.id)}
              style={{
                textAlign: 'left',
                background: activeId === h.id ? 'var(--color-bg-card)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${activeId === h.id ? 'var(--color-primary)' : 'transparent'}`,
                borderRadius: '0 6px 6px 0',
                padding: `5px 8px 5px ${h.level === 1 ? 8 : h.level === 2 ? 16 : 24}px`,
                cursor: 'pointer',
                fontSize: h.level === 1 ? 13 : 12,
                fontWeight: h.level === 1 ? 600 : activeId === h.id ? 500 : 400,
                color: activeId === h.id ? 'var(--color-text)' : 'var(--color-text-muted)',
                lineHeight: 1.4,
                width: '100%',
              }}
            >
              {h.text}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content — scrolls independently */}
      <div
        ref={contentRef}
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          overflowY: 'auto',
          padding: '28px 40px 64px',
        }}
      >
        <div style={{ maxWidth: 860 }}>
          <h1
            style={{
              fontSize: 22,
              marginBottom: 24,
              paddingBottom: 12,
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            {title}
          </h1>

          {loading ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
          ) : (
            <div className="doc-content">
              <ReactMarkdown components={components}>{content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
