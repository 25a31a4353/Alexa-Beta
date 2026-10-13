import React, { useEffect, useState } from 'react';
import { BookOpen, FileText, Search, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { listKnowledge } from '../api/client';
import { KnowledgeDocument } from '../types';

export const KnowledgePage: React.FC = () => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);

  const loadDocs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listKnowledge();
      setDocs(data.documents || []);
      if (data.documents && data.documents.length > 0) {
        setSelectedDoc(data.documents[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Knowledge Intelligence</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Connected SQLite document repository and contextual assets inspected during mission planning.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadDocs} className="flex items-center space-x-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Querying SQLite documents...</p>
        </div>
      ) : error ? (
        <Card variant="light" className="p-8 text-center border-rose-200 bg-rose-50/50">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-rose-900">Failed to load knowledge documents</h3>
          <p className="text-xs text-rose-600 mt-1">{error}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document list */}
          <div className="lg:col-span-1 space-y-3">
            {docs.map((doc) => (
              <Card
                key={doc.id}
                variant="light"
                onClick={() => setSelectedDoc(doc)}
                className={`cursor-pointer transition-all p-4 ${
                  selectedDoc?.id === doc.id
                    ? 'border-blue-500 ring-1 ring-blue-500/30 bg-blue-50/30'
                    : 'hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <Badge variant="info" size="sm">{doc.file_type}</Badge>
                  <span className="text-[11px] text-slate-400">{doc.page_count} pages</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 truncate">{doc.title}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">{doc.filename}</p>
              </Card>
            ))}
          </div>

          {/* Document detail inspector */}
          <div className="lg:col-span-2">
            {selectedDoc ? (
              <Card variant="light" className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedDoc.title}</h2>
                    <p className="text-xs text-slate-500">{selectedDoc.filename} • {selectedDoc.size_mb} MB • Category: {selectedDoc.category}</p>
                  </div>
                  <Badge variant="success">Persisted</Badge>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-1.5">Executive Summary</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                    {selectedDoc.summary}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">Select a document to inspect details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
