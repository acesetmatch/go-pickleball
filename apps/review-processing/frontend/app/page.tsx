'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { post } from './api';

export default function Page() {
  const [url, setUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'channel'>('video');

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-3xl font-semibold">YouCap</h1>
      <p className="text-gray-600">Extract, search, and summarize YouTube captions from videos or entire channels.</p>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('video')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'video'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Single Video
          </button>
          <button
            onClick={() => setActiveTab('channel')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'channel'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Entire Channel
          </button>
        </nav>
      </div>

      {/* Video Tab */}
      {activeTab === 'video' && (
        <div className="max-w-xl space-y-3">
          <input 
            value={url} 
            onChange={e => setUrl(e.target.value)} 
            placeholder="Paste YouTube video URL (e.g., https://www.youtube.com/watch?v=...)" 
            className="w-full border p-2 rounded" 
          />
          <button 
            onClick={async () => {
              setLoading(true); 
              setMsg(''); 
              try { 
                const r = await post<{
                  video_id?: string, 
                  chunks: number, 
                  is_channel: boolean,
                  successful_videos?: string[],
                  failed_videos?: string[],
                  total_videos?: number
                }>(`/ingest`, {url}); 
                
                if (r.is_channel) {
                  setMsg(`Channel ingestion complete!\n✅ ${r.successful_videos?.length || 0} videos successful\n❌ ${r.failed_videos?.length || 0} videos failed\n📊 Total chunks: ${r.chunks}`);
                } else {
                  setMsg(`Ingested ${r.video_id} with ${r.chunks} chunks.`);
                }
              } catch(e: any) { 
                setMsg(e.message);
              } finally { 
                setLoading(false);
              } 
            }} 
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !url.trim()}
          >
            {loading ? 'Ingesting Video…' : 'Ingest Video'}
          </button>
        </div>
      )}

      {/* Channel Tab */}
      {activeTab === 'channel' && (
        <div className="max-w-xl space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Channel URL or Handle
            </label>
            <input 
              value={channelId} 
              onChange={e => setChannelId(e.target.value)} 
              placeholder="@username, channel URL, or channel ID" 
              className="w-full border p-2 rounded" 
            />
            <div className="text-xs text-gray-500 space-y-1">
              <div>Supported formats:</div>
              <div>• @username (e.g., @mkbhd)</div>
              <div>• Channel URL (e.g., https://www.youtube.com/channel/UC...)</div>
              <div>• Handle URL (e.g., https://www.youtube.com/@username)</div>
              <div>• Channel ID (e.g., UCBJycsmduvYEL83R_U4JriQ)</div>
            </div>
          </div>
          <button 
            onClick={async () => {
              setLoading(true); 
              setMsg(''); 
              try {
                // Convert channel input to proper URL format if needed
                let channelUrl = channelId.trim();
                
                // If it's just a handle without @, add it
                if (!channelUrl.startsWith('http') && !channelUrl.startsWith('@') && !channelUrl.startsWith('UC')) {
                  channelUrl = `@${channelUrl}`;
                }
                
                // If it's a handle or channel ID, convert to URL
                if (channelUrl.startsWith('@')) {
                  channelUrl = `https://www.youtube.com/${channelUrl}`;
                } else if (channelUrl.startsWith('UC') && channelUrl.length === 24) {
                  channelUrl = `https://www.youtube.com/channel/${channelUrl}`;
                }
                
                const r = await post<{
                  video_id?: string, 
                  chunks: number, 
                  is_channel: boolean,
                  successful_videos?: string[],
                  failed_videos?: string[],
                  total_videos?: number
                }>(`/ingest`, {url: channelUrl}); 
                
                if (r.is_channel) {
                  setMsg(`🎉 Channel ingestion complete!\n\n✅ ${r.successful_videos?.length || 0} videos successfully ingested\n❌ ${r.failed_videos?.length || 0} videos failed\n📊 Total chunks created: ${r.chunks}\n📺 Total videos processed: ${r.total_videos}\n\nYou can now search, analyze, and summarize content from this entire channel!`);
                } else {
                  setMsg(`Ingested ${r.video_id} with ${r.chunks} chunks.`);
                }
              } catch(e: any) { 
                setMsg(`❌ Channel ingestion failed:\n${e.message}\n\nPlease check:\n• YouTube API key is configured\n• Channel URL/handle is correct\n• Channel has public videos`);
              } finally { 
                setLoading(false);
              } 
            }} 
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            disabled={loading || !channelId.trim()}
          >
            {loading ? 'Ingesting Channel… (this may take a while)' : 'Ingest Entire Channel'}
          </button>
          
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
              <div className="font-medium">Processing channel...</div>
              <div>This will ingest up to 200 videos from the channel. Each video will be transcribed and indexed for search.</div>
              <div className="mt-1 text-blue-600">⏱️ Estimated time: 2-5 minutes depending on channel size</div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {msg && (
        <div className="max-w-xl">
          <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap border">{msg}</pre>
        </div>
      )}
      
      <div className="pt-8">
        <Link className="underline" href="/videos">Browse & Search →</Link>
      </div>
    </main>
  );
}
