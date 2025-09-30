'use client';
import React, { useState } from 'react';
import { post, get } from '../api';

interface Video {
  video_id: string;
  title: string;
  channel: string;
  url: string;
}

interface SearchResult {
  video_id: string;
  start_ms: number;
  end_ms: number;
  text: string;
  video_title: string;
  video_channel: string;
  video_url: string;
  similarity_score: number;
  start_seconds: number;
  end_seconds: number;
}

interface AnalysisSection {
  caption_count: number;
  percentage: number;
  summary: string;
  time_range: {
    start_seconds: number;
    end_seconds: number;
  };
}

interface Analysis {
  video_id: string;
  title: string;
  channel: string;
  url: string;
  sections: Record<string, AnalysisSection>;
}

export default function VideosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [summary, setSummary] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'analyze' | 'summarize'>('search');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await post<{results: SearchResult[]}>('/search', {
        query: searchQuery,
        limit: 10
      });
      setSearchResults(result.results);
    } catch (e: any) {
      console.error('Search failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedVideo) return;
    setLoading(true);
    try {
      const result = await post<Analysis>('/analyze', {
        video_id: selectedVideo
      });
      setAnalysis(result);
    } catch (e: any) {
      console.error('Analysis failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async (minutes?: number) => {
    if (!selectedVideo) return;
    setLoading(true);
    try {
      const path = minutes ? `/summarize/${selectedVideo}?minutes=${minutes}` : `/summarize/${selectedVideo}`;
      const result = await get<{summary: string}>(path);
      setSummary(result.summary);
    } catch (e: any) {
      console.error('Summarization failed:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Videos</h1>
        <a href="/" className="text-blue-600 underline">← Back to Ingest</a>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['search', 'analyze', 'summarize'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search video content..."
              className="flex-1 border p-2 rounded"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Search Results ({searchResults.length})</h3>
              {searchResults.map((result, idx) => (
                <div key={idx} className="border rounded p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-600">
                        <a href={result.video_url} target="_blank" rel="noopener noreferrer">
                          {result.video_title || result.video_id}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-600">{result.video_channel}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(result.start_seconds)} - {formatTime(result.end_seconds)}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      Score: {(result.similarity_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-gray-800">{result.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analyze Tab */}
      {activeTab === 'analyze' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <input
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              placeholder="Enter video ID (e.g., 6As_OJe9nDo)"
              className="flex-1 border p-2 rounded"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !selectedVideo}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          {analysis && (
            <div className="space-y-6">
              <div className="border rounded p-4">
                <h3 className="text-lg font-medium">{analysis.title}</h3>
                <p className="text-gray-600">{analysis.channel}</p>
                <a href={analysis.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Watch Video →
                </a>
              </div>

              <div className="grid gap-4">
                <h4 className="text-lg font-medium">Content Sections</h4>
                {Object.entries(analysis.sections).map(([sectionName, section]) => (
                  <div key={sectionName} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium capitalize">{sectionName}</h5>
                      <div className="text-sm text-gray-500">
                        {section.percentage}% ({section.caption_count} segments)
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{section.summary}</p>
                    <p className="text-sm text-gray-500">
                      Time: {formatTime(section.time_range.start_seconds)} - {formatTime(section.time_range.end_seconds)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summarize Tab */}
      {activeTab === 'summarize' && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <input
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              placeholder="Enter video ID (e.g., 6As_OJe9nDo)"
              className="flex-1 border p-2 rounded"
            />
            <button
              onClick={() => handleSummarize()}
              disabled={loading || !selectedVideo}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Summarizing...' : 'Full Summary'}
            </button>
            <button
              onClick={() => handleSummarize(2)}
              disabled={loading || !selectedVideo}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            >
              First 2 Min
            </button>
          </div>

          {summary && (
            <div className="border rounded p-4">
              <h3 className="text-lg font-medium mb-4">Summary</h3>
              <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">{summary}</pre>
            </div>
          )}
        </div>
      )}

      {/* Quick Test Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Quick Test with Sample Data</h3>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              setSelectedVideo('6As_OJe9nDo');
              setActiveTab('analyze');
            }}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
          >
            Load Sample Video
          </button>
          <button
            onClick={() => {
              setSearchQuery('price and cost');
              setActiveTab('search');
            }}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
          >
            Search "price and cost"
          </button>
          <button
            onClick={() => {
              setSearchQuery('pros and cons');
              setActiveTab('search');
            }}
            className="px-3 py-1 bg-gray-200 rounded text-sm"
          >
            Search "pros and cons"
          </button>
        </div>
      </div>
    </main>
  );
}
