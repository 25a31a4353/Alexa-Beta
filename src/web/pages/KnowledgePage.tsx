import React, { useEffect, useState, useMemo } from 'react';
import {
  BookOpen,
  Upload,
  Search,
  FileText,
  Lightbulb,
  Database,
  BarChart2,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Check,
  ChevronRight,
  AlertCircle,
  Loader2,
  Info,
  X
} from 'lucide-react';
import { listKnowledge, getKnowledgeDocument, uploadKnowledgeDocument } from '../api/client';
import { KnowledgeDocument } from '../types';
import { cn } from '../lib/utils';

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedDocDetail, setSelectedDocDetail] = useState<KnowledgeDocument | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'summary' | 'insights' | 'actions' | 'related' | 'metadata'>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showUploadNotice, setShowUploadNotice] = useState<boolean>(false);

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Meeting');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadContent.trim()) return;

    setIsUploadingDoc(true);
    setUploadError(null);
    try {
      const res = await uploadKnowledgeDocument({
        title: uploadTitle.trim(),
        filename: `${uploadTitle.trim().replace(/\s+/g, '_')}.txt`,
        fileType: 'TXT',
        category: uploadCategory,
        content: uploadContent.trim(),
        summary: uploadContent.trim().length > 250 ? `${uploadContent.trim().substring(0, 247)}...` : uploadContent.trim()
      });

      if (res && res.document) {
        setIsUploadModalOpen(false);
        setUploadTitle('');
        setUploadContent('');
        // Reload documents list
        const refreshed = await listKnowledge();
        setDocuments(refreshed.documents || []);
        setSelectedDocId(res.document.id);
      }
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to index document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // 1. Fetch initial documents list from real backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setSearchError(null);

    listKnowledge()
      .then((data) => {
        if (!isMounted) return;
        const docs = data.documents || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[KnowledgePage] Failed to fetch documents:', err);
        setSearchError('Failed to load documents from backend repository.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch full document details whenever selectedDocId changes
  useEffect(() => {
    if (!selectedDocId) {
      setSelectedDocDetail(null);
      return;
    }
    let isMounted = true;
    setIsDetailLoading(true);

    getKnowledgeDocument(selectedDocId)
      .then((doc) => {
        if (!isMounted) return;
        setSelectedDocDetail(doc);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[KnowledgePage] Failed to fetch document detail:', err);
      })
      .finally(() => {
        if (isMounted) setIsDetailLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDocId]);

  // Execute genuine search using Application API -> MCP knowledge_search tool
  const executeSearch = (queryText: string, categoryVal = activeCategory) => {
    setIsSearching(true);
    setSearchError(null);
    const cat = categoryVal === 'all' ? undefined : categoryVal;

    listKnowledge(cat, queryText.trim() || undefined)
      .then((data) => {
        const docs = data.documents || [];
        setDocuments(docs);
        if (docs.length > 0) {
          if (!docs.some((d) => d.id === selectedDocId)) {
            setSelectedDocId(docs[0].id);
          }
        } else {
          setSelectedDocId('');
          setSelectedDocDetail(null);
        }
      })
      .catch((err) => {
        console.warn('[KnowledgePage] Search error:', err);
        setSearchError(err.message || 'Knowledge search failed.');
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  // Derive categories dynamically from actual persisted records (never hardcode fake categories)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('all');
    documents.forEach((d) => {
      if (d.category) cats.add(d.category.toLowerCase());
    });
    return Array.from(cats);
  }, [documents]);

  const currentDoc = selectedDocDetail || documents.find((d) => d.id === selectedDocId) || null;

  const dynamicInsights: string[] = useMemo(() => {
    return selectedDocDetail?.key_insights || [];
  }, [selectedDocDetail]);

  const dynamicActionItems: string[] = useMemo(() => {
    return selectedDocDetail?.action_items || [];
  }, [selectedDocDetail]);

  const toggleCheckbox = (item: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  // Helper for file type badge styling
  const renderFileIcon = (fileType?: string) => {
    const type = (fileType || 'FILE').toUpperCase();
    if (type.includes('PDF')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs flex-shrink-0">
          PDF
        </div>
      );
    }
    if (type.includes('DOC') || type.includes('WORD')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs flex-shrink-0">
          DOCX
        </div>
      );
    }
    if (type.includes('SHEET') || type.includes('XLS') || type.includes('DATA')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs flex-shrink-0">
          XLS
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-slate-600 text-white flex items-center justify-center font-bold text-[9px] shadow-2xs flex-shrink-0">
        FILE
      </div>
    );
  };

  // Category badge styles
  const getCategoryBadge = (category: string) => {
    const cat = category.toLowerCase();
    switch (cat) {
      case 'meeting':
      case 'meetings':
        return <span className="text-[11px] font-medium text-purple-600">Meeting</span>;
      case 'research':
        return <span className="text-[11px] font-medium text-blue-600">Research</span>;
      case 'data':
        return <span className="text-[11px] font-medium text-emerald-600">Data</span>;
      case 'notes':
        return <span className="text-[11px] font-medium text-rose-500">Notes</span>;
      case 'planning':
        return <span className="text-[11px] font-medium text-indigo-500">Planning</span>;
      default:
        return <span className="text-[11px] font-medium text-slate-500">{category}</span>;
    }
  };

  const formatDateDisplay = (isoString?: string) => {
    if (!isoString) return 'Persisted';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Persisted';
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* =========================================================================
            1. HEADER AREA: Title, Subtitle & Upload Notice
            ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-2xs">
              <BookOpen className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Knowledge
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  SQLite Grounded
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 mt-0.5">
                Authentic documents indexed for MCP tools (<code className="font-mono text-slate-700">knowledge_search</code> and <code className="font-mono text-slate-700">document_analyze</code>).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Upload className="w-4 h-4 text-white" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Upload Information Banner (Honest capability model) */}
        {showUploadNotice && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-start justify-between shadow-2xs">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs md:text-sm font-bold text-blue-900">
                  Persisted SQLite Knowledge Repository
                </h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  The active knowledge repository contains verified seeded enterprise specifications, competitor analyses, and roadmaps stored in SQLite. External cloud upload sync is restricted to read-only audit mode in this environment.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadNotice(false)}
              className="text-blue-500 hover:text-blue-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================================
            2. TOP ROW OF 4 FEATURE ACTION CARDS
            ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Search & Retrieve */}
          <div
            onClick={() => {
              const el = document.getElementById('knowledge-search-input');
              if (el) el.focus();
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-start space-x-3 hover:border-slate-300 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/90 flex items-center justify-center text-blue-500 flex-shrink-0 group-hover:bg-blue-100/80 transition-colors">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Search & Retrieve
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Query via real MCP <code className="font-mono text-[10px]">knowledge_search</code>.
              </p>
            </div>
          </div>

          {/* Card 2: Analyze Documents */}
          <div
            onClick={() => {
              const targetDoc = currentDoc ? currentDoc.title : 'Q4 Product Roadmap';
              window.location.hash = `#/new?prompt=${encodeURIComponent(`Analyze available project specifications and roadmap documentation in knowledge base for "${targetDoc}". Summarize key information, extract critical technical insights, and identify unknown dependencies.`)}`;
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-start space-x-3 hover:border-slate-300 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100/90 flex items-center justify-center text-purple-500 flex-shrink-0 group-hover:bg-purple-100/80 transition-colors">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Analyze Documents
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Extract insights with <code className="font-mono text-[10px]">document_analyze</code>.
              </p>
            </div>
          </div>

          {/* Card 3: Find Insights */}
          <div
            onClick={() => {
              window.location.hash = `#/new?prompt=${encodeURIComponent('Search knowledge repository for roadmap documents and investor meeting notes, cross-reference strategic priorities, and summarize key decisions.')}`;
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-start space-x-3 hover:border-slate-300 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/90 flex items-center justify-center text-amber-500 flex-shrink-0 group-hover:bg-amber-100/80 transition-colors">
              <Lightbulb className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Find Insights
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Discover strategic decisions and risks.
              </p>
            </div>
          </div>

          {/* Card 4: Saved Knowledge */}
          <div
            onClick={() => {
              setActiveCategory('all');
              setSearchQuery('');
              executeSearch('', 'all');
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex items-start space-x-3 hover:border-slate-300 transition-colors cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/90 flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover:bg-emerald-100/80 transition-colors">
              <Database className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-xs md:text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Saved Knowledge
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                {documents.length} verified documents in SQLite.
              </p>
            </div>
          </div>

        </div>

        {/* Error Notice */}
        {searchError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchError}</span>
            </div>
            <button
              onClick={() => {
                setSearchError(null);
                executeSearch('', 'all');
              }}
              className="text-xs font-semibold underline hover:text-rose-900 ml-4"
            >
              Reset
            </button>
          </div>
        )}

        {/* =========================================================================
            3. MAIN TWO-COLUMN SPLIT
            Left Column: Search Knowledge & Recent Documents
            Right Column: Document Detail Inspector (Tabs, Summary, Key Insights, Action Items)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* ==================== LEFT COLUMN: Search & Recent Documents ==================== */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Search Knowledge Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm md:text-base font-bold text-slate-900">
                  Search Knowledge
                </h2>
                {isSearching && (
                  <span className="text-xs text-blue-600 flex items-center space-x-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Searching MCP...</span>
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="knowledge-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        executeSearch(searchQuery);
                      }
                    }}
                    placeholder="Search documents, notes, or roadmap topics..."
                    className="w-full bg-white border border-slate-200 text-slate-800 text-xs pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400 font-medium"
                  />
                </div>
                <button
                  onClick={() => executeSearch(searchQuery)}
                  disabled={isSearching}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-2.5 rounded-xl shadow-2xs transition-colors flex-shrink-0"
                >
                  <Search className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Category Filter Pills (Derived dynamically from real documents) */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-1">
                {availableCategories.map((cat) => {
                  const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const newCat = cat.toLowerCase();
                        setActiveCategory(newCat);
                        executeSearch(searchQuery, newCat);
                      }}
                      className={cn(
                        'text-xs px-3.5 py-1.5 rounded-full font-medium transition-colors whitespace-nowrap capitalize',
                        isActive
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                      )}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Documents Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Documents ({documents.length})
                </h3>
                {(searchQuery || activeCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setActiveCategory('all');
                      setSearchQuery('');
                      executeSearch('', 'all');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <span>Clear filters</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Document List Rows */}
              {isLoading ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
                  <p className="text-xs text-slate-500 mt-2">Loading documents from SQLite store...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                  <h4 className="text-xs md:text-sm font-bold text-slate-800">No Documents Found</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {searchQuery ? `No documents matched "${searchQuery}".` : 'No documents exist in this category.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                      executeSearch('', 'all');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline pt-1"
                  >
                    View all documents
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => {
                    const isSelected = selectedDocId === doc.id;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocId(doc.id)}
                        className={cn(
                          'p-3 rounded-2xl border transition-all cursor-pointer group bg-white shadow-2xs space-y-1.5',
                          isSelected
                            ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-50/20'
                            : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          {/* Left: Icon + Title & Subtitle */}
                          <div className="flex items-center space-x-3 truncate mr-2">
                            {renderFileIcon(doc.file_type)}
                            <div className="truncate">
                              <h4
                                className={cn(
                                  'text-xs md:text-sm font-semibold truncate transition-colors',
                                  isSelected ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'
                                )}
                              >
                                {doc.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {doc.file_type} {doc.page_count ? `• ${doc.page_count} pages` : ''} • {doc.size_mb} MB
                              </p>
                            </div>
                          </div>

                          {/* Right: Category Tag & Date */}
                          <div className="flex items-center space-x-3 flex-shrink-0 text-right">
                            <div>{getCategoryBadge(doc.category)}</div>
                            <div className="text-[11px] text-slate-400 font-medium">
                              {formatDateDisplay(doc.uploaded_at)}
                            </div>
                          </div>
                        </div>

                        {/* Search Relevance & Real MCP Snippet */}
                        {doc.relevance && (
                          <div className="pt-1 flex items-center justify-between text-[11px] border-t border-slate-100">
                            <span className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold',
                              doc.relevance === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              doc.relevance === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            )}>
                              {doc.relevance} Relevance {doc.relevance_score ? `(${Math.round(doc.relevance_score * 100)}%)` : ''}
                            </span>
                            {doc.snippet && (
                              <span className="text-slate-400 italic truncate max-w-[220px] text-[10px]">
                                {doc.snippet}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ==================== RIGHT COLUMN: Document Detail Inspector ==================== */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
            
            {currentDoc ? (
              <>
                {/* Header: Document Identity & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-start space-x-3.5 truncate">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                      {currentDoc.file_type || 'PDF'}
                    </div>
                    <div className="truncate">
                      <h2 className="text-base md:text-lg font-bold text-slate-900 truncate leading-snug">
                        {currentDoc.title}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono">
                        {currentDoc.filename} • {currentDoc.file_type} • {currentDoc.page_count} pages • {currentDoc.size_mb} MB
                      </p>
                    </div>
                  </div>

                  {/* Actions: Use in Mission & Summarize */}
                  <div className="flex items-center space-x-2 flex-shrink-0 self-start">
                    <button
                      onClick={() => {
                        const promptText = `Analyze the document "${currentDoc.title}" (${currentDoc.filename}) and extract key insights, actionable next steps, and potential risks for upcoming meetings.`;
                        window.location.hash = `#/new?prompt=${encodeURIComponent(promptText)}`;
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors"
                      title="Launch a real mission using this document"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Use in Mission</span>
                    </button>
                    <button
                      onClick={() => {
                        const promptText = `Summarize the document "${currentDoc.title}" (${currentDoc.filename}) and identify key strategic priorities.`;
                        window.location.hash = `#/new?prompt=${encodeURIComponent(promptText)}`;
                      }}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span>Summarize</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Tabs Bar */}
                <div className="flex items-center space-x-6 border-b border-slate-100 text-xs overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('summary')}
                    className={cn(
                      'pb-2.5 font-semibold transition-colors relative whitespace-nowrap',
                      activeTab === 'summary'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Summary
                  </button>
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={cn(
                      'pb-2.5 font-semibold transition-colors relative whitespace-nowrap',
                      activeTab === 'insights'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Key Insights ({dynamicInsights.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('actions')}
                    className={cn(
                      'pb-2.5 font-semibold transition-colors relative whitespace-nowrap',
                      activeTab === 'actions'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Action Items ({dynamicActionItems.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('related')}
                    className={cn(
                      'pb-2.5 font-semibold transition-colors relative whitespace-nowrap',
                      activeTab === 'related'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Related Content
                  </button>
                  <button
                    onClick={() => setActiveTab('metadata')}
                    className={cn(
                      'pb-2.5 font-semibold transition-colors relative whitespace-nowrap',
                      activeTab === 'metadata'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    Metadata
                  </button>
                </div>

                {/* Detail Loading State */}
                {isDetailLoading && (
                  <div className="py-8 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                    <p className="text-xs text-slate-400 mt-2">Loading document contents from SQLite...</p>
                  </div>
                )}

                {/* Tab Content Display */}
                {!isDetailLoading && (
                  <div className="space-y-6 pt-1">
                    
                    {/* Section A: Document Summary Box */}
                    {(activeTab === 'summary' || activeTab === 'insights' || activeTab === 'actions') && (
                      <div className="bg-blue-50/50 border border-blue-100/90 rounded-2xl p-4 space-y-2 shadow-2xs">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <FileText className="w-4 h-4 stroke-[2.2]" />
                          <h3 className="text-xs md:text-sm font-bold text-slate-900">
                            Document Summary
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {currentDoc.summary || 'No summary stored for this document.'}
                        </p>
                      </div>
                    )}

                    {/* Section A2: Full Content Preview (on Summary tab) */}
                    {activeTab === 'summary' && currentDoc.content && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-900">Persisted Content Excerpt</h4>
                        <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-mono max-h-56 overflow-y-auto leading-relaxed">
                          {currentDoc.content}
                        </div>
                      </div>
                    )}

                    {/* Section B: Key Insights */}
                    {(activeTab === 'summary' || activeTab === 'insights') && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-blue-500">
                          <BarChart2 className="w-4 h-4 stroke-[2.2]" />
                          <h3 className="text-xs md:text-sm font-bold text-slate-900">
                            Key Insights
                          </h3>
                        </div>
                        {dynamicInsights.length > 0 ? (
                          <ul className="space-y-2 pl-1">
                            {dynamicInsights.map((insight, idx) => (
                              <li key={idx} className="flex items-start space-x-2 text-xs text-slate-600 leading-relaxed">
                                <span className="text-blue-500 font-bold text-base leading-none select-none">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-400 italic pl-1">
                            No key insights recorded for this document in the database.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Section C: Action Items */}
                    {(activeTab === 'summary' || activeTab === 'actions') && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2 text-amber-500">
                          <CheckSquare className="w-4 h-4 stroke-[2.2]" />
                          <h3 className="text-xs md:text-sm font-bold text-slate-900">
                            Action Items
                          </h3>
                        </div>
                        {dynamicActionItems.length > 0 ? (
                          <div className="space-y-2 pl-1">
                            {dynamicActionItems.map((item, idx) => {
                              const isChecked = !!checkedItems[item];
                              return (
                                <div
                                  key={idx}
                                  onClick={() => toggleCheckbox(item)}
                                  className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer select-none group"
                                >
                                  <div
                                    className={cn(
                                      'w-4 h-4 rounded border mt-0.5 flex items-center justify-center transition-colors flex-shrink-0',
                                      isChecked
                                        ? 'bg-amber-500 border-amber-500 text-white'
                                        : 'border-slate-300 group-hover:border-amber-400 bg-white'
                                    )}
                                  >
                                    {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                  <span className={cn('leading-relaxed', isChecked ? 'line-through text-slate-400' : '')}>
                                    {item}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic pl-1">
                            No action items recorded for this document in the database.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Section D: Related Content Tab */}
                    {activeTab === 'related' && (
                      <div className="space-y-3">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900">Other Documents in Knowledge Base</h3>
                        <div className="space-y-2">
                          {documents.filter((d) => d.id !== currentDoc.id).map((rel) => (
                            <div
                              key={rel.id}
                              onClick={() => setSelectedDocId(rel.id)}
                              className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
                            >
                              <div className="flex items-center space-x-2.5 truncate">
                                {renderFileIcon(rel.file_type)}
                                <div className="truncate">
                                  <span className="text-xs font-semibold text-slate-800 truncate block">{rel.title}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">{rel.filename}</span>
                                </div>
                              </div>
                              <span className="text-xs text-blue-600 font-medium flex items-center gap-1 flex-shrink-0">
                                Inspect <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section E: Metadata Tab */}
                    {activeTab === 'metadata' && (
                      <div className="space-y-3">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900">Document Technical Metadata</h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-slate-400 text-[11px]">Document ID</div>
                            <div className="font-mono text-slate-700 font-semibold mt-0.5">{currentDoc.id}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-slate-400 text-[11px]">Filename</div>
                            <div className="font-mono text-slate-700 font-semibold mt-0.5">{currentDoc.filename}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-slate-400 text-[11px]">Storage Engine</div>
                            <div className="text-slate-700 font-semibold mt-0.5">SQLite Persistence Layer</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-slate-400 text-[11px]">MCP Compatibility</div>
                            <div className="text-emerald-600 font-semibold mt-0.5">Indexed for MCP Tools</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-slate-400 text-[11px]">File Format</div>
                            <div className="font-mono text-slate-700 font-semibold mt-0.5">{currentDoc.file_type}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                            <div className="text-slate-400 text-[11px]">Indexed At</div>
                            <div className="text-slate-700 font-semibold mt-0.5">{formatDateDisplay(currentDoc.uploaded_at)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center space-y-2">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No Document Selected</h3>
                <p className="text-xs text-slate-400">
                  Select a document from the left column to view its full details.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Upload & Index Document</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Q4 Executive Strategy"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Meeting">Meeting</option>
                  <option value="Planning">Planning</option>
                  <option value="Research">Research</option>
                  <option value="Data">Data</option>
                  <option value="Notes">Notes</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Document Content
                </label>
                <textarea
                  required
                  rows={6}
                  value={uploadContent}
                  onChange={(e) => setUploadContent(e.target.value)}
                  placeholder="Paste or write the document text to index into SQLite knowledge base..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                />
              </div>

              {uploadError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  {uploadError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingDoc}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center space-x-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {isUploadingDoc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Indexing in SQLite...</span>
                    </>
                  ) : (
                    <span>Upload & Index</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
