'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  FileText,
  Database,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import ReactMarkdown from 'react-markdown';

const API_BASE_URL = 'http://127.0.0.1:8000';

const SCENARIOS = [
  { id: 'stripe', name: 'Stripe API (Charges vs PaymentIntent)' },
  { id: 'react', name: 'React 18 (Event Delegation)' },
  { id: 'nextjs', name: 'Next.js 14 (Pages vs App Router)' },
  { id: 'aws_s3', name: 'AWS SDK v3 (Modular Imports)' },
  { id: 'python', name: 'Python 2 vs 3 (Print Statement)' },
  { id: 'openai', name: 'OpenAI Python SDK (v1.0 Migration)' },
  { id: 'tailwind', name: 'Tailwind CSS v3 (Dark Mode)' },
  { id: 'kubernetes', name: 'Kubernetes (Dockershim Removal)' },
  { id: 'github_actions', name: 'GitHub Actions (Set-Output)' },
  { id: 'flutter', name: 'Flutter (WillPopScope Deprecation)' },
];

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');
  const { toast } = useToast();

  // 1. Initialize Session ID on Load
  useEffect(() => {
    let sid = localStorage.getItem('rag_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('rag_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Helper for Headers
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
  });

  const loadScenario = async (scenarioId: string) => {
    setIsLoading(true);
    setActiveScenario(scenarioId);
    setAnswer('');
    setIssues([]);

    try {
      const res = await fetch(`${API_BASE_URL}/load-scenario`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      if (!res.ok) throw new Error('Failed to load scenario');

      toast({
        title: 'Scenario Loaded',
        description: 'Knowledge base updated with conflicting documentation.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load scenario.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim()) return;
    setIsChatting(true);
    setAnswer('');

    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: query }),
      });

      const data = await res.json();
      setAnswer(data.response);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Chat Failed' });
    } finally {
      setIsChatting(false);
    }
  };

  const runAudit = async () => {
    setIsLoading(true);
    setIssues([]);

    try {
      const res = await fetch(`${API_BASE_URL}/maintenance`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setIssues(data.issues || []);

      if (data.issues?.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Conflicts Found',
          description: 'Review the audit report below.',
        });
      } else {
        toast({
          title: 'All Clear',
          description: 'No documentation conflicts detected.',
        });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Audit Failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100'>
      <Toaster />

      {/* Navbar */}
      <header className='bg-white border-b sticky top-0 z-10'>
        <div className='max-w-5xl mx-auto px-6 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2 text-indigo-600'>
            <Database className='w-6 h-6' />
            <h1 className='font-bold text-xl tracking-tight'>
              DocuGuard{' '}
              <span className='text-slate-400 font-normal text-sm ml-2 hidden sm:inline-block'>
                SaaS Auditor
              </span>
            </h1>
          </div>
          <div className='text-xs text-slate-400 font-mono'>
            Session: {sessionId.slice(0, 8)}...
          </div>
        </div>
      </header>

      <main className='max-w-5xl mx-auto px-6 py-10 space-y-8'>
        {/* Hero Section */}
        <div className='grid md:grid-cols-3 gap-6'>
          {/* 1. Control Panel */}
          <Card className='md:col-span-1 shadow-sm border-slate-200 h-fit'>
            <CardHeader className='bg-slate-50/50 pb-4'>
              <CardTitle className='text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2'>
                <Wrench className='w-4 h-4' /> Simulation Control
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 pt-6'>
              <div className='space-y-2'>
                <label className='text-xs font-medium text-slate-700'>
                  Select Tech Scenario
                </label>
                <Select onValueChange={loadScenario} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder='Load Demo Data...' />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIOS.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={runAudit}
                className='w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 shadow-lg transition-all'
                disabled={!activeScenario || isLoading}
              >
                {isLoading ? (
                  <Spinner className='mr-2 text-white' />
                ) : (
                  <Sparkles className='mr-2 w-4 h-4' />
                )}
                Run Audit Agent
              </Button>

              <div className='text-xs text-slate-400 text-center px-4 leading-relaxed'>
                Step 1: Load a scenario.
                <br />
                Step 2: Run the agent to detect conflicts.
              </div>
            </CardContent>
          </Card>

          {/* 2. Audit Report Area */}
          <div className='md:col-span-2 space-y-6'>
            {/* AUDIT CARDS */}
            {issues.length > 0 ? (
              <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
                {issues.map((issueStr, i) => {
                  let data;
                  try {
                    const cleanJson = issueStr.substring(
                      issueStr.indexOf('{'),
                      issueStr.lastIndexOf('}') + 1,
                    );
                    data = JSON.parse(cleanJson);
                  } catch (e) {
                    return null;
                  }

                  if (!data.contradiction) return null;

                  return (
                    <Card
                      key={i}
                      className='border-l-4 border-l-red-500 shadow-md overflow-hidden'
                    >
                      <div className='bg-red-50 px-6 py-4 flex justify-between items-center border-b border-red-100'>
                        <div className='flex items-center gap-2 text-red-700 font-bold'>
                          <AlertTriangle className='w-5 h-5' />
                          <span>Conflict Detected</span>
                        </div>
                        <span className='bg-white text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-200 shadow-sm uppercase'>
                          {data.severity || 'Critical'}
                        </span>
                      </div>

                      <div className='p-6 space-y-6'>
                        <div className='space-y-2'>
                          <h3 className='font-semibold text-slate-900'>
                            Analysis
                          </h3>
                          <p className='text-slate-600 leading-relaxed text-sm'>
                            {data.reason}
                          </p>
                        </div>

                        {/* DIFF VIEW STRATEGY 4 */}
                        <div className='grid grid-cols-2 gap-4 text-sm bg-slate-50 rounded-lg p-4 border border-slate-200'>
                          <div>
                            <span className='block text-xs font-bold text-slate-400 uppercase mb-1'>
                              Old Documentation
                            </span>
                            <p className='text-slate-500 line-through decoration-red-400/50 bg-white p-2 rounded border border-slate-100 min-h-[60px]'>
                              "{data.old_quote || '...'}"
                            </p>
                          </div>
                          <div>
                            <span className='block text-xs font-bold text-slate-400 uppercase mb-1'>
                              New Changelog
                            </span>
                            <p className='text-slate-800 bg-white p-2 rounded border border-slate-100 min-h-[60px] font-medium'>
                              "{data.new_quote || '...'}"
                            </p>
                          </div>
                        </div>

                        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                          <div className='flex items-center gap-2 text-green-800 font-semibold mb-2'>
                            <CheckCircle2 className='w-4 h-4' /> Suggested
                            Remediation
                          </div>
                          <code className='block bg-white text-green-700 px-3 py-2 rounded border border-green-100 text-xs font-mono'>
                            {data.fix}
                          </code>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // Empty State
              <div className='h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50'>
                <FileText className='w-12 h-12 mb-3 opacity-20' />
                <h3 className='font-semibold text-slate-600'>
                  Waiting for Analysis
                </h3>
                <p className='text-sm max-w-xs mx-auto mt-1'>
                  Select a scenario from the left panel and click "Run Audit
                  Agent" to see the magic happen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Interactive Chat */}
        <Card className='shadow-sm border-slate-200'>
          <CardHeader className='border-b bg-slate-50/50'>
            <CardTitle className='text-base flex items-center gap-2'>
              <MessageSquare className='w-4 h-4 text-indigo-500' />
              Verify with AI
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='p-6 bg-slate-50 min-h-[100px] max-h-[400px] overflow-y-auto'>
              {answer ? (
                <div className='flex gap-4'>
                  <div className='w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0'>
                    <Sparkles className='w-4 h-4 text-indigo-600' />
                  </div>

                  {/* Replaced raw <p> tag with ReactMarkdown */}
                  <div className='text-slate-700 text-sm leading-relaxed mt-1 w-full prose prose-sm max-w-none'>
                    <ReactMarkdown
                      components={{
                        // Bold text: Make it Indigo and semi-bold
                        strong: ({ node, ...props }) => (
                          <span
                            className='font-semibold text-indigo-700'
                            {...props}
                          />
                        ),
                        // Lists: Add bullets and spacing
                        ul: ({ node, ...props }) => (
                          <ul
                            className='list-disc pl-4 space-y-1 my-2'
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className='list-decimal pl-4 space-y-1 my-2'
                            {...props}
                          />
                        ),
                        // Paragraphs: Add spacing between blocks
                        p: ({ node, ...props }) => (
                          <p className='mb-3 last:mb-0' {...props} />
                        ),
                        // Code Blocks: Dark mode style
                        code: ({
                          node,
                          inline,
                          className,
                          children,
                          ...props
                        }: any) => {
                          return inline ? (
                            // Inline code (like `variable`)
                            <code
                              className='bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs font-medium'
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            // Block code (like the JSON example)
                            <div className='my-3 overflow-hidden rounded-lg bg-slate-900 shadow-sm'>
                              <div className='flex items-center gap-1.5 bg-slate-800/50 px-4 py-2'>
                                <div className='h-2.5 w-2.5 rounded-full bg-red-500/20' />
                                <div className='h-2.5 w-2.5 rounded-full bg-yellow-500/20' />
                                <div className='h-2.5 w-2.5 rounded-full bg-green-500/20' />
                              </div>
                              <pre className='p-4 overflow-x-auto text-slate-50 font-mono text-xs'>
                                <code {...props}>{children}</code>
                              </pre>
                            </div>
                          );
                        },
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <p className='text-slate-400 text-sm italic text-center mt-4'>
                  Ask a question to verify the conflict...
                </p>
              )}
            </div>
            <div className='p-4 border-t bg-white flex gap-2'>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 'How do I create a charge in the new version?'"
                className='border-slate-200 focus-visible:ring-indigo-500'
              />
              <Button
                onClick={handleChat}
                disabled={isChatting}
                className='bg-slate-900 text-white'
              >
                {isChatting ? <Spinner /> : <Send className='w-4 h-4' />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
