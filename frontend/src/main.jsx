import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BookOpenText, ChevronDown, CircleHelp, FileSearch, FileText, Files, Menu, MessageSquareText, Search, ShieldCheck, Upload, X } from 'lucide-react';
import { askQuestion, searchDocuments, uploadDocument } from './api';
import './styles.css';

function App() {
  const [view, setView] = useState('ask');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchData, setSearchData] = useState(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [topK, setTopK] = useState(10);
  const [threshold, setThreshold] = useState(0.25);
  const [file, setFile] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [openEvidence, setOpenEvidence] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const fileRef = useRef(null);

  const navigate = (next) => { setView(next); setMobileNav(false); };

  async function submitQuestion(event) {
    event.preventDefault();
    const query = question.trim();
    if (!query || askBusy) return;
    setAskBusy(true); setAskError(''); setAnswer(null); setOpenEvidence(null);
    try { setAnswer(await askQuestion(query)); } catch (error) { setAskError(error.message); }
    finally { setAskBusy(false); }
  }

  async function submitSearch(event) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query || searchBusy) return;
    setSearchBusy(true); setSearchError(''); setSearchData(null);
    try { setSearchData(await searchDocuments(query, Number(topK), Number(threshold))); } catch (error) { setSearchError(error.message); }
    finally { setSearchBusy(false); }
  }

  function chooseFile(candidate) {
    setUploadMessage(null);
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith('.pdf') || (candidate.type && candidate.type !== 'application/pdf')) {
      setFile(null); setUploadMessage({ type: 'error', text: 'Choose a PDF file to continue.' }); return;
    }
    setFile(candidate);
  }

  async function submitUpload() {
    if (!file || uploadBusy) return;
    setUploadBusy(true); setUploadMessage(null);
    try {
      const result = await uploadDocument(file);
      setUploadMessage({ type: 'success', text: result.message || 'Document processed successfully.', detail: `${result.filename} · ${result.pages_extracted} pages · ${result.total_chunks} chunks` });
      setFile(null);
    } catch (error) { setUploadMessage({ type: 'error', text: error.message }); }
    finally { setUploadBusy(false); }
  }

  return <div className="app-shell">
    {mobileNav && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><ShieldCheck size={19} strokeWidth={1.7} /></span><span>FinGuard<span className="brand-ai"> AI</span></span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-list">
        <button className={`nav-item ${view === 'ask' ? 'active' : ''}`} onClick={() => navigate('ask')}><MessageSquareText size={17} />Ask Policy</button>
        <button className={`nav-item ${view === 'documents' ? 'active' : ''}`} onClick={() => navigate('documents')}><Files size={17} />Documents</button>
        <button className={`nav-item ${view === 'search' ? 'active' : ''}`} onClick={() => navigate('search')}><FileSearch size={17} />Search</button>
      </nav>
      <div className="sidebar-divider" />
      <button className="upload-nav" onClick={() => navigate('documents')}><Upload size={16} />Upload a document</button>
      <div className="sidebar-bottom"><div className="tool-note"><ShieldCheck size={16} /><span>Policy research tool</span></div><p>Answers are grounded in your indexed documents.</p><div className="version">FINGUARD AI <span>·</span> DOCUMENT INTELLIGENCE</div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><button className="menu-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{view === 'ask' ? 'Ask Policy' : view === 'documents' ? 'Documents' : 'Search'}</strong></div><div className="topbar-status"><span className="status-dot" />RESEARCH WORKSPACE</div></header>
      <div className="content-wrap">
        {view === 'ask' && <section className="page-view">
          <div className="page-heading"><div className="eyebrow">POLICY RESEARCH</div><h1>Ask Policy</h1><p>Banking policy research and document intelligence.</p></div>
          <form className="question-box" onSubmit={submitQuestion}><label htmlFor="question">What would you like to know?</label><textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(e); } }} placeholder="Ask a question about your indexed banking policies..." rows={3} /><div className="question-actions"><span className="input-hint">Enter to submit <span>·</span> Shift + Enter for a new line</span><button className="primary-button" type="submit" disabled={!question.trim() || askBusy}>{askBusy ? <><span className="spinner" />Researching</> : <><Search size={15} />Ask question</>}</button></div></form>
          {askError && <div className="notice error-notice"><CircleHelp size={17} /><span>{askError}</span></div>}
          {askBusy && <div className="loading-row"><span className="spinner dark-spinner" />Searching indexed policies and preparing an evidence-based answer…</div>}
          {!answer && !askBusy && !askError && <div className="empty-research"><div className="empty-icon"><BookOpenText size={21} /></div><h2>Start with your policy library</h2><p>Ask a question to retrieve relevant passages and receive an answer grounded in your documents.</p><button className="text-link" onClick={() => navigate('documents')}>Add a policy document <span>→</span></button></div>}
          {answer && <AnswerPanel answer={answer} openEvidence={openEvidence} setOpenEvidence={setOpenEvidence} onSearch={() => { setSearchQuery(answer.query); navigate('search'); }} />}
          <div className="page-footnote">FinGuard AI can only answer from indexed source material. Review cited passages before making policy decisions.</div>
        </section>}
        {view === 'documents' && <section className="page-view"><div className="page-heading"><div className="eyebrow">LIBRARY</div><h1>Documents</h1><p>Index policy PDFs to make their contents available for research.</p></div>
          <div className={`drop-zone ${dragging ? 'drag-active' : ''}`} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0]); }}>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" hidden onChange={e => chooseFile(e.target.files?.[0])} />
            <div className="drop-icon"><Upload size={20} /></div><h2>Upload a policy document</h2><p>Drag and drop a PDF here, or browse your files.</p><button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}>Choose PDF</button><div className="file-rule">PDF files only <span>·</span> Text-based PDFs work best</div>
          </div>
          {file && <div className="selected-file"><span className="file-icon"><FileText size={17} /></span><div className="selected-meta"><strong>{file.name}</strong><span>{formatSize(file.size)}</span></div><button className="icon-button" aria-label="Remove selected file" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}><X size={17} /></button><button className="primary-button upload-submit" disabled={uploadBusy} onClick={submitUpload}>{uploadBusy ? <><span className="spinner" />Indexing</> : <><Upload size={15} />Upload & index</>}</button></div>}
          {uploadBusy && <div className="progress-wrap"><div className="progress-track"><div className="progress-indeterminate" /></div><p>Extracting text, creating embeddings, and indexing your document…</p></div>}
          {uploadMessage && <div className={`notice ${uploadMessage.type === 'error' ? 'error-notice' : 'success-notice'}`}><span className="notice-mark">{uploadMessage.type === 'error' ? '!' : '✓'}</span><div><strong>{uploadMessage.text}</strong>{uploadMessage.detail && <small>{uploadMessage.detail}</small>}</div></div>}
          <div className="info-card"><div className="info-card-icon"><CircleHelp size={17} /></div><div><strong>About document processing</strong><p>Scanned PDFs without a text layer may not be searchable. This service extracts embedded text and does not currently use OCR. Uploading a PDF with the same filename replaces its indexed content.</p></div></div>
        </section>}
        {view === 'search' && <section className="page-view"><div className="page-heading"><div className="eyebrow">RETRIEVAL INSPECTION</div><h1>Search documents</h1><p>Review matching passages directly, without generating an answer.</p></div>
          <form className="search-form" onSubmit={submitSearch}><div className="search-input-wrap"><Search size={18} /><input aria-label="Search indexed documents" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search your indexed policies…" /><button type="submit" className="primary-button" disabled={!searchQuery.trim() || searchBusy}>{searchBusy ? <><span className="spinner" />Searching</> : 'Search'}</button></div><div className="search-controls"><label>Results <select value={topK} onChange={e => setTopK(e.target.value)}>{[3, 5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}</select></label><label>Minimum relevance <select value={threshold} onChange={e => setThreshold(e.target.value)}>{[-1, 0, 0.15, 0.25, 0.4, 0.6, 0.8].map(n => <option key={n} value={n}>{n === -1 ? 'Any' : n.toFixed(2)}</option>)}</select></label><span>Relevance is a retrieval similarity score, not answer confidence.</span></div></form>
          {searchError && <div className="notice error-notice"><CircleHelp size={17} /><span>{searchError}</span></div>}
          {searchBusy && <div className="loading-row"><span className="spinner dark-spinner" />Finding matching passages…</div>}
          {searchData && <div className="results-section"><div className="results-heading"><div><div className="eyebrow">RETRIEVED EVIDENCE</div><h2>{searchData.results_count ?? searchData.results?.length ?? 0} matching passages</h2></div><span className="query-chip">“{searchData.query}”</span></div>{searchData.results?.length ? <div className="result-list">{searchData.results.map((result, index) => <article className="result-card" key={`${result.source}-${result.chunk_id}-${index}`}><div className="result-meta"><span className="result-source"><FileText size={14} />{result.source}</span><span>Page {result.page}</span><span>{result.chunk_id}</span><span className="relevance">Similarity {Number(result.similarity).toFixed(3)}</span></div><p>{result.text}</p></article>)}</div> : <div className="no-results"><FileSearch size={22} /><strong>No relevant passages found</strong><span>{searchData.message || 'Try a different query or lower the minimum relevance threshold.'}</span></div>}</div>}
          {!searchData && !searchBusy && !searchError && <div className="search-empty"><FileSearch size={20} /><span>Search retrieves relevant text chunks from your indexed documents.</span></div>}
        </section>}
      </div>
    </main>
  </div>;
}

function AnswerPanel({ answer, openEvidence, setOpenEvidence, onSearch }) {
  const sources = Array.isArray(answer.sources) ? answer.sources : [];
  const citations = [...(answer.answer || '').matchAll(/\[(S\d+)\]/g)].map(m => m[1]);
  const hasUnmatched = citations.some(id => !sources.some(source => source.source_id === id));
  const lowEvidence = sources.length === 0;
  const chunks = Number(answer.retrieved_chunks || 0);
  return <article className="answer-panel"><div className="answer-question-label">YOUR QUESTION</div><h2 className="answer-question">{answer.query}</h2><div className="answer-rule" /><div className="answer-label">RESEARCH RESPONSE <span>{chunks} {chunks === 1 ? 'passage' : 'passages'} retrieved</span></div><div className="answer-copy">{answer.answer?.split(/\n\n+/).map((paragraph, index) => <p key={index}>{paragraph.split(/(\[S\d+\])/g).map((part, partIndex) => /^\[S\d+\]$/.test(part) ? <span className="inline-citation" key={partIndex}>{part}</span> : part)}</p>)}</div>
    {lowEvidence ? <div className="evidence-empty"><CircleHelp size={16} /><span>No relevant sources were returned. The indexed documents did not provide sufficient evidence for this question.</span></div> : <div className="sources-block"><div className="sources-heading"><h3>Sources</h3><span>{sources.length} retrieved</span></div>{sources.map((source, index) => <div className="source-row" key={source.source_id || `${source.source}-${source.chunk_id}-${index}`}><button className="source-main" onClick={() => setOpenEvidence(openEvidence === source.source_id ? null : source.source_id)}><span className="source-id">{source.source_id || '—'}</span><span className="source-details"><strong>{source.source}</strong><small>Page {source.page} <span>·</span> {source.chunk_id}</small></span><span className="source-similarity">Similarity {Number(source.similarity).toFixed(3)}</span><ChevronDown size={16} className={`source-chevron ${openEvidence === source.source_id ? 'expanded' : ''}`} /></button>{openEvidence === source.source_id && <div className="evidence-unavailable">The /ask response provides source metadata but not passage text. <button onClick={onSearch}>Search for the passages</button> to inspect retrieved text.</div>}</div>)}</div>}
    {hasUnmatched && <div className="citation-note">Some citations in the generated answer did not match a returned source ID; they are shown as provided and have not been linked to other evidence.</div>}
    <div className="answer-disclaimer">Always verify policy interpretations against the original document.</div></article>;
}

function formatSize(bytes) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
