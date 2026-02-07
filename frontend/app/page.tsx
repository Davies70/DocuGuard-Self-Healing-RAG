'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  MessageSquare,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Send,
  RefreshCw,
  Sparkles,
  FileText, // Added icon for the new branding
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const API_BASE_URL = 'http://127.0.0.1:8000';

interface ApiError {
  message: string;
  status?: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [isRunningMaintenance, setIsRunningMaintenance] = useState(false);
  const [docsIngested, setDocsIngested] = useState(false);
  const { toast } = useToast();

  const handleApiError = (error: unknown, context: string): ApiError => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Unable to connect to the server. Please ensure the backend is running.',
        status: 0,
      };
    }
    
    if (error instanceof Error) {
      return { message: error.message };
    }
    
    return { message: 'An unexpected error occurred. Please try again.' };
  };

  const handleIngest = async () => {
    setIsIngesting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ingest`, { method: 'POST' });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      setDocsIngested(true);
      toast({
        title: 'Documents Ingested Successfully',
        description: 'Your knowledge base is now ready for queries.',
      });
    } catch (error) {
      const apiError = handleApiError(error, 'document ingestion');
      toast({
        variant: 'destructive',
        title: 'Ingestion Failed',
        description: apiError.message,
      });
    } finally {
      setIsIngesting(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim()) {
      toast({
        variant: 'destructive',
        title: 'Empty Query',
        description: 'Please enter a question before submitting.',
      });
      return;
    }

    setIsChatting(true);
    setAnswer('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data.response) {
        throw new Error('Invalid response format from server');
      }
      
      setAnswer(data.response);
    } catch (error) {
      const apiError = handleApiError(error, 'chat');
      toast({
        variant: 'destructive',
        title: 'Chat Request Failed',
        description: apiError.message,
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleMaintenance = async () => {
    setIsRunningMaintenance(true);
    setIssues([]);
    
    try {
      const res = await fetch(`${API_BASE_URL}/maintenance`);
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      const foundIssues = data.issues || [];
      setIssues(foundIssues);
      
      if (foundIssues.length === 0) {
        toast({
          title: 'System Healthy',
          description: 'No documentation conflicts detected.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Conflicts Detected',
          description: `Found ${foundIssues.length} inconsistencies between docs and changelogs.`,
        });
      }
    } catch (error) {
      const apiError = handleApiError(error, 'maintenance');
      toast({
        variant: 'destructive',
        title: 'Audit Check Failed',
        description: apiError.message,
      });
    } finally {
      setIsRunningMaintenance(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isChatting) {
      handleChat();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                SaaS Documentation Auditor
              </h1>
              <p className="text-sm text-muted-foreground">
                Automated detection of deprecated features and documentation conflicts
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="size-4 text-primary" />
                Knowledge Base
              </CardTitle>
              <CardDescription>
                Ingest latest Docs and Changelogs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleIngest}
                disabled={isIngesting}
                className="w-full"
                variant={docsIngested ? 'secondary' : 'default'}
              >
                {isIngesting ? (
                  <>
                    <Spinner className="mr-2" />
                    Ingesting...
                  </>
                ) : docsIngested ? (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Re-Sync Documents
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 size-4" />
                    Sync Documents
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wrench className="size-4 text-primary" />
                Audit Agent
              </CardTitle>
              <CardDescription>
                Scan for discrepancies between versions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleMaintenance}
                disabled={isRunningMaintenance}
                variant="outline"
                className="w-full bg-transparent"
              >
                {isRunningMaintenance ? (
                  <>
                    <Spinner className="mr-2" />
                    Auditing Documents...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    Run Audit Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* --- AUDIT FINDINGS SECTION (UPDATED) --- */}
        {issues.length > 0 && (
            <div className="space-y-4">
               <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <AlertTriangle className="text-red-600" /> 
                 Audit Findings
               </h2>
               
               {issues.map((issueStr, i) => {
                  let data;
                  try {
                    // Clean the JSON string (Grok sometimes adds text before/after)
                    const cleanJson = issueStr.substring(issueStr.indexOf('{'), issueStr.lastIndexOf('}') + 1);
                    data = JSON.parse(cleanJson);
                  } catch (e) { 
                    // Fallback for raw text errors
                    return (
                        <Alert key={i} variant="destructive">
                            <AlertTitle>Raw Error Log</AlertTitle>
                            <AlertDescription>{issueStr}</AlertDescription>
                        </Alert>
                    ); 
                  }

                  if (!data.contradiction) return null;

                  return (
                    <div key={i} className="bg-white border-l-4 border-red-500 shadow-sm rounded-r-lg p-6 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">⚠️ Outdated Documentation Detected</h3>
                            <p className="text-sm text-gray-500 mt-1">Audit detected a discrepancy between Docs and Changelog.</p>
                        </div>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                            {data.severity || "Critical"} Severity
                        </span>
                      </div>

                      <div className="mt-4 bg-gray-50 p-4 rounded-md border border-gray-100">
                        <p className="font-semibold text-gray-700 text-sm mb-1">Analysis:</p>
                        <p className="text-gray-600 text-sm leading-relaxed">{data.reason}</p>
                      </div>

                      <div className="mt-4">
                        <p className="font-semibold text-green-700 text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="size-4" /> Suggested Fix:
                        </p>
                        <div className="bg-green-50 p-3 rounded-md border border-green-200 text-green-800 font-mono text-xs shadow-inner">
                            {data.fix}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
        )}

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              Ask a Question
            </CardTitle>
            <CardDescription>
              Query your knowledge base regarding API specs and updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g., How do I authenticate in v2.0?"
                disabled={isChatting}
                className="flex-1"
              />
              <Button
                onClick={handleChat}
                disabled={isChatting || !query.trim()}
              >
                {isChatting ? (
                  <Spinner />
                ) : (
                  <Send className="size-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </div>

            {/* Answer Display */}
            {(answer || isChatting) && (
              <div className="rounded-lg border bg-muted/50 p-4">
                {isChatting ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Spinner />
                    <span>Analyzing documents...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-foreground">
                    <p className="whitespace-pre-wrap leading-relaxed">{answer}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Hint */}
        <p className="text-center text-xs text-muted-foreground">
          Tip: Ingest documents first. The Audit Agent automatically cross-references Changelogs against Documentation.
        </p>
      </main>
    </div>
  );
}