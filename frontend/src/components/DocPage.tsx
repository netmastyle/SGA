import { useEffect, useRef, useState } from 'react';
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
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(contentUrl)
      .then((r) => r.text())
      .then((text) => {
        setContent(text);
        setHeadings(extractHeadings(text));
        setLoading(false);
      })
      .catch(() => { setContent('Error al cargar la documentación.'); setLoading(false); });
  }, [contentUrl]);

  // Track active heading on scroll
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const anchors = el.querySelectorAll<HTMLElement>('[data-doc-id]');
      let current = '';
      anchors.forEach((node) => {
        if (node.getBoundingClientRect().top <= 120) current = node.getAttribute('data-doc-id') ?? '';
      });
      setActiveId(current);
    };
    const main = document.querySelector('main') ?? window;
    main.addEventListener('scroll', onScroll, { passive: true });
    return () => main.removeEventListener('scroll', onScroll);
  }, [loading]);

  function scrollTo(id: string) {
    const el = contentRef.current?.querySelector(`[data-doc-id="${id}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Custom renderers — add id anchors to headings
  const components: Components = {
    h1: ({ children }) => {
      const id = slugify(String(children));
      return <h1 data-doc-id={id} style={{ scrollMarginTop: 80 }}>{children}</h1>;
    },
    h2: ({ children }) => {
      const id = slugify(String(children));
      return <h2 data-doc-id={id} style={{ scrollMarginTop: 80 }}>{children}</h2>;
    },
    h3: ({ children }) => {
      const id = slugify(String(children));
      return <h3 data-doc-id={id} style={{ scrollMarginTop: 80 }}>{children}</h3>;
    },
  };

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto' }}>

      {/* TOC sidebar */}
      <aside style={{
        width: 220,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        maxHeight: 'calc(100vh - 64px)',
        overflowY: 'auto',
        paddingRight: 8,
      }}>
        <button
          onClick={() => navigate(-1)}
          className="btn"
          style={{ padding: '6px 14px', fontSize: 13, width: '100%', marginBottom: 16 }}
        >
          ← Volver
        </button>

        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Contenido
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {headings.map((h) => (
            <button
              key={h.id + h.text}
              onClick={() => scrollTo(h.id)}
              style={{
                textAlign: 'left',
                background: activeId === h.id ? 'var(--color-bg-card)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${activeId === h.id ? 'var(--color-primary)' : 'transparent'}`,
                borderRadius: '0 6px 6px 0',
                padding: `4px 8px 4px ${h.level === 1 ? 8 : h.level === 2 ? 16 : 24}px`,
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

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 22, marginBottom: 24, paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
          {title}
        </h1>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
        ) : (
          <div ref={contentRef} className="doc-content">
            <ReactMarkdown components={components}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
