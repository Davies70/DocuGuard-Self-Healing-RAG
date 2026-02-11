'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Send,
  Sparkles,
  FileText,
  Copy,
  Check,
  Trash2,
  Terminal,
  WifiOff,
  XCircle,
  RefreshCw,
  Shield,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

// const API_BASE_URL = 'http://127.0.0.1:8000';

// const API_BASE_URL = 'http://3.68.108.28:8000';

const SCENARIOS = [
  { id: 'stripe', name: 'Stripe API', detail: 'Charges vs PaymentIntent' },
  { id: 'react', name: 'React 18', detail: 'Event Delegation' },
  { id: 'nextjs', name: 'Next.js 14', detail: 'Pages vs App Router' },
  { id: 'aws_s3', name: 'AWS SDK v3', detail: 'Modular Imports' },
  { id: 'python', name: 'Python 2 vs 3', detail: 'Print Statement' },
  { id: 'openai', name: 'OpenAI SDK', detail: 'v1.0 Migration' },
  { id: 'tailwind', name: 'Tailwind CSS v3', detail: 'Dark Mode' },
  { id: 'kubernetes', name: 'Kubernetes', detail: 'Dockershim Removal' },
  { id: 'github_actions', name: 'GitHub Actions', detail: 'Set-Output' },
  { id: 'flutter', name: 'Flutter', detail: 'WillPopScope Deprecation' },
];

type ApiErrorInfo = {
  title: string;
  description: string;
  isNetwork: boolean;
};

function getErrorInfo(error: unknown, context: string): ApiErrorInfo {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      title: 'Connection Failed',
      description: `Unable to reach the server.`,
      isNetwork: true,
    };
  }
  if (error instanceof SyntaxError) {
    return {
      title: 'Invalid Response',
      description: `The server returned an unexpected response during ${context}. The API may be misconfigured.`,
      isNetwork: false,
    };
  }
  const message =
    error instanceof Error ? error.message : 'An unknown error occurred';
  return {
    title: `${context} Failed`,
    description: message,
    isNetwork: false,
  };
}

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [issues, setIssues] = useState<string[]>([]);
  const [isLoadingScenario, setIsLoadingScenario] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [activeScenario, setActiveScenario] = useState('');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [auditComplete, setAuditComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let sid = localStorage.getItem('rag_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('rag_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    if (answer && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [answer]);

  const getHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'X-Session-ID': sessionId,
    }),
    [sessionId],
  );

  const getActiveScenarioName = () => {
    const scenario = SCENARIOS.find((s) => s.id === activeScenario);
    return scenario ? `${scenario.name} - ${scenario.detail}` : '';
  };

  const loadScenario = async (scenarioId: string) => {
    setIsLoadingScenario(true);
    setActiveScenario(scenarioId);
    setAnswer('');
    setIssues([]);
    setConnectionError(null);
    setChatError(null);
    setAuditComplete(false);

    try {
      const res = await fetch(`api/load-scenario`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(
          res.status === 404
            ? `Scenario "${scenarioId}" not found on the server.`
            : res.status === 500
              ? 'Internal server error. Check the backend logs for details.'
              : `Server returned ${res.status}${errorText ? `: ${errorText}` : ''}`,
        );
      }

      const scenario = SCENARIOS.find((s) => s.id === scenarioId);
      toast({
        title: 'Environment Loaded',
        description: `${scenario?.name} scenario is ready. You can now run an audit or ask questions.`,
      });
    } catch (error) {
      const info = getErrorInfo(error, 'Loading scenario');
      if (info.isNetwork) {
        setConnectionError(info.description);
      }
      toast({
        variant: 'destructive',
        title: info.title,
        description: info.description,
      });
      setActiveScenario('');
    } finally {
      setIsLoadingScenario(false);
    }
  };

  const handleChat = async () => {
    if (!query.trim()) return;
    setIsChatting(true);
    setAnswer('');
    setChatError(null);

    try {
      const res = await fetch(`api/chat`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ message: query }),
      });

      if (!res.ok) {
        throw new Error(
          res.status === 429
            ? 'Rate limited. Please wait a moment before trying again.'
            : `Server error (${res.status}). Please try again.`,
        );
      }

      const data = await res.json();

      if (!data.response) {
        throw new Error(
          'The server returned an empty response. The query may not have matched any documents.',
        );
      }

      setAnswer(data.response);
    } catch (error) {
      const info = getErrorInfo(error, 'Chat');
      setChatError(info.description);
      if (info.isNetwork) setConnectionError(info.description);
      toast({
        variant: 'destructive',
        title: info.title,
        description: info.description,
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isChatting && query.trim()) {
      handleChat();
    }
  };

  const clearChat = () => {
    setQuery('');
    setAnswer('');
    setChatError(null);
  };

  const runAudit = async () => {
    setIsAuditing(true);
    setIssues([]);
    setConnectionError(null);
    setAuditComplete(false);

    try {
      const res = await fetch(`api/maintenance`, {
        headers: getHeaders(),
      });

      if (!res.ok) {
        throw new Error(
          `Audit request failed with status ${res.status}. The maintenance endpoint may be unavailable.`,
        );
      }

      const data = await res.json();
      setIssues(data.issues || []);
      setAuditComplete(true);

      if (data.issues?.length > 0) {
        toast({
          variant: 'destructive',
          title: `${data.issues.length} Conflict${data.issues.length > 1 ? 's' : ''} Found`,
          description: 'Scroll down to review the detailed audit report.',
        });
      } else {
        toast({
          title: 'Audit Complete',
          description:
            'No documentation conflicts were detected in this environment.',
        });
      }
    } catch (error) {
      const info = getErrorInfo(error, 'Audit');
      if (info.isNetwork) setConnectionError(info.description);
      toast({
        variant: 'destructive',
        title: info.title,
        description: info.description,
      });
    } finally {
      setIsAuditing(false);
    }
  };

  const isAnythingLoading = isLoadingScenario || isAuditing;

  return (
    <div className='min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100'>
      <Toaster />

      {/* Header */}
      <header className='bg-white border-b sticky top-0 z-20 shadow-sm'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <div className='bg-indigo-600 p-1.5 rounded-lg'>
              <Shield className='w-4 h-4 text-white' />
            </div>
            <h1 className='font-bold text-lg tracking-tight text-slate-900'>
              DocuGuard
            </h1>
            <span className='text-slate-400 font-normal text-xs border-l pl-2.5 border-slate-200 hidden sm:block'>
              Self-Healing RAG Auditor
            </span>
          </div>
          <div className='flex items-center gap-3'>
            {connectionError && (
              <div className='flex items-center gap-1.5 text-xs text-red-500 font-medium'>
                <WifiOff className='w-3.5 h-3.5' />
                <span className='hidden sm:inline'>Disconnected</span>
              </div>
            )}
            {!connectionError && sessionId && (
              <div className='text-[11px] text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100'>
                {sessionId.slice(0, 8)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className='bg-red-50 border-b border-red-200'>
          <div className='max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-start gap-3'>
            <WifiOff className='w-4 h-4 text-red-500 mt-0.5 shrink-0' />
            <div className='flex-1 min-w-0'>
              <p className='text-sm font-semibold text-red-800'>
                Backend Unreachable
              </p>
              <p className='text-xs text-red-600 mt-0.5 leading-relaxed'>
                {connectionError}
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setConnectionError(null)}
              className='text-red-600 border-red-200 hover:bg-red-100 shrink-0 h-7 text-xs bg-transparent'
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <main className='max-w-6xl mx-auto px-4 sm:px-6 py-8'>
        <div className='grid lg:grid-cols-12 gap-6'>
          {/* LEFT SIDEBAR */}
          <div className='lg:col-span-4 xl:col-span-3'>
            <div className='sticky top-20 space-y-4'>
              <Card className='shadow-sm border-slate-200'>
                <CardHeader className='pb-3 border-b border-slate-100'>
                  <CardTitle className='text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2'>
                    <Wrench className='w-3.5 h-3.5' /> Control Panel
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-5 pt-5'>
                  {/* Step 1: Scenario */}
                  <div className='space-y-2'>
                    <label className='text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5'>
                      <span className='bg-indigo-100 text-indigo-600 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold'>
                        1
                      </span>
                      Load Environment
                    </label>
                    <Select
                      onValueChange={loadScenario}
                      disabled={isAnythingLoading}
                    >
                      <SelectTrigger className='w-full bg-white border-slate-200 cursor-pointer'>
                        <SelectValue placeholder='Select a scenario...' />
                      </SelectTrigger>
                      <SelectContent>
                        {SCENARIOS.map((s) => (
                          <SelectItem key={s.id} value={s.id} className='cursor-pointer'>
                            <span className='font-medium'>{s.name}</span>
                            <span className='text-muted-foreground ml-1'>
                              ({s.detail})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isLoadingScenario && (
                      <div className='flex items-center gap-2 text-xs text-indigo-600 py-1'>
                        <Spinner className='text-indigo-600' />
                        <span>Loading environment...</span>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Audit */}
                  <div className='space-y-2'>
                    <label className='text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5'>
                      <span className='bg-indigo-100 text-indigo-600 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold'>
                        2
                      </span>
                      Run Audit
                    </label>
                    <Button
                      onClick={runAudit}
                      className='w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer'
                      disabled={!activeScenario || isAnythingLoading}
                    >
                      {isAuditing ? (
                        <>
                          <Spinner className='mr-2 text-white' />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className='mr-2 w-4 h-4' />
                          Run Auto-Auditor
                        </>
                      )}
                    </Button>
                    {!activeScenario && (
                      <p className='text-[11px] text-slate-400 leading-relaxed'>
                        Select a scenario first to enable the auditor.
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  {activeScenario && (
                    <div className='border-t border-slate-100 pt-4 space-y-2'>
                      <p className='text-[11px] font-semibold text-slate-500 uppercase tracking-wide'>
                        Status
                      </p>
                      <div className='space-y-1.5'>
                        <div className='flex items-center gap-2 text-xs'>
                          <CheckCircle2 className='w-3.5 h-3.5 text-green-500' />
                          <span className='text-slate-600'>
                            {getActiveScenarioName()}
                          </span>
                        </div>
                        {auditComplete && (
                          <div className='flex items-center gap-2 text-xs'>
                            {issues.length > 0 ? (
                              <>
                                <AlertTriangle className='w-3.5 h-3.5 text-amber-500' />
                                <span className='text-slate-600'>
                                  {issues.length} conflict
                                  {issues.length > 1 ? 's' : ''} found
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className='w-3.5 h-3.5 text-green-500' />
                                <span className='text-slate-600'>
                                  No conflicts detected
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Help Tip */}
                  <div className='bg-slate-50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed'>
                    <div className='flex items-start gap-2'>
                      <Info className='w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0' />
                      <span>
                        Load a scenario to inject conflicting docs, then audit
                        to detect and remediate issues automatically.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className='lg:col-span-8 xl:col-span-9 space-y-6'>
            {/* AUDIT RESULTS */}
            {auditComplete && issues.length > 0 && (
              <section className='space-y-4'>
                <div className='flex items-center justify-between pb-2 border-b border-slate-200'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='w-4 h-4 text-amber-500' />
                    <h2 className='font-bold text-base text-slate-800'>
                      Audit Report
                    </h2>
                    <span className='bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full'>
                      {issues.length} issue{issues.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setIssues([]);
                      setAuditComplete(false);
                    }}
                    className='text-slate-400 hover:text-slate-600 h-7 text-xs'
                  >
                    Clear
                  </Button>
                </div>

                {issues.map((issueStr, i) => {
                  let data: Record<string, string>;
                  try {
                    const cleanJson = issueStr.substring(
                      issueStr.indexOf('{'),
                      issueStr.lastIndexOf('}') + 1,
                    );
                    data = JSON.parse(cleanJson);
                  } catch {
                    return (
                      <Card
                        key={i}
                        className='border-l-4 border-l-amber-400 shadow-sm'
                      >
                        <CardContent className='p-4'>
                          <div className='flex items-start gap-3'>
                            <AlertTriangle className='w-4 h-4 text-amber-500 mt-0.5 shrink-0' />
                            <div>
                              <p className='text-sm font-medium text-slate-700 mb-1'>
                                Unparseable Finding
                              </p>
                              <p className='text-xs text-slate-500 font-mono break-all leading-relaxed'>
                                {issueStr}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }

                  if (!data.contradiction) return null;

                  return (
                    <Card
                      key={i}
                      className='border-l-4 border-l-red-500 shadow-sm overflow-hidden hover:shadow-md transition-shadow'
                    >
                      <div className='bg-red-50/60 px-5 py-3 flex justify-between items-center border-b border-red-100'>
                        <span className='text-red-800 font-bold text-sm'>
                          Conflict #{i + 1}
                        </span>
                        <span className='bg-white text-red-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider'>
                          {data.severity || 'Critical'}
                        </span>
                      </div>

                      <div className='p-5 space-y-4'>
                        <div>
                          <h3 className='text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5'>
                            Analysis
                          </h3>
                          <p className='text-slate-700 text-sm leading-relaxed'>
                            {data.reason}
                          </p>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                          <div className='bg-slate-50 p-3 rounded-lg border border-slate-100'>
                            <span className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1.5'>
                              <FileText className='w-3 h-3' /> Outdated Doc
                            </span>
                            <p className='text-slate-500 line-through decoration-red-300/60 text-xs font-mono leading-relaxed bg-white p-2 rounded border border-slate-100'>
                              {`"${data.old_quote || '...'}"`}
                            </p>
                          </div>
                          <div className='bg-slate-50 p-3 rounded-lg border border-slate-100'>
                            <span className='flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1.5'>
                              <Terminal className='w-3 h-3' /> Changelog
                            </span>
                            <p className='text-slate-800 text-xs font-mono leading-relaxed bg-white p-2 rounded border border-slate-100 border-l-2 border-l-green-500'>
                              {`"${data.new_quote || '...'}"`}
                            </p>
                          </div>
                        </div>

                        <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                          <div className='flex items-center gap-1.5 text-green-800 font-bold text-xs mb-1.5'>
                            <CheckCircle2 className='w-3.5 h-3.5' /> Remediation
                          </div>
                          <code className='block bg-white text-green-700 px-3 py-2 rounded border border-green-100 text-xs font-mono leading-relaxed'>
                            {data.fix}
                          </code>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </section>
            )}

            {/* ALL CLEAR STATE */}
            {auditComplete && issues.length === 0 && (
              <Card className='border-green-200 bg-green-50/50 shadow-sm'>
                <CardContent className='p-6'>
                  <div className='flex items-center gap-3'>
                    <div className='bg-green-100 p-2.5 rounded-full'>
                      <CheckCircle2 className='w-5 h-5 text-green-600' />
                    </div>
                    <div>
                      <p className='font-bold text-green-800 text-sm'>
                        No Conflicts Detected
                      </p>
                      <p className='text-xs text-green-600 mt-0.5'>
                        The documentation for {getActiveScenarioName()} is
                        consistent with the changelog.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CHAT INTERFACE */}
            <section className='space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <MessageSquare className='w-4 h-4 text-indigo-600' />
                  <h2 className='font-bold text-base text-slate-800'>
                    Verification Agent
                  </h2>
                </div>
                {(answer || chatError) && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={clearChat}
                    className='text-slate-400 hover:text-red-500 h-7 text-xs'
                  >
                    <Trash2 className='w-3 h-3 mr-1' /> Clear
                  </Button>
                )}
              </div>

              <Card className='shadow-sm border-slate-200 overflow-hidden'>
                <CardContent className='p-0'>
                  {/* Chat Output Area */}
                  <div className='bg-slate-50/50 min-h-[200px] max-h-[500px] overflow-y-auto p-5'>
                    {isChatting && (
                      <div className='flex items-center gap-3 py-8 justify-center'>
                        <Spinner className='text-indigo-500' />
                        <span className='text-sm text-slate-500'>
                          Thinking...
                        </span>
                      </div>
                    )}

                    {chatError && !isChatting && (
                      <div className='flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-100'>
                        <XCircle className='w-4 h-4 text-red-500 mt-0.5 shrink-0' />
                        <div>
                          <p className='text-sm font-semibold text-red-800'>
                            Could not get a response
                          </p>
                          <p className='text-xs text-red-600 mt-1 leading-relaxed'>
                            {chatError}
                          </p>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={handleChat}
                            className='mt-3 text-red-600 border-red-200 hover:bg-red-100 h-7 text-xs bg-transparent'
                          >
                            <RefreshCw className='w-3 h-3 mr-1.5' /> Retry
                          </Button>
                        </div>
                      </div>
                    )}

                    {answer && !isChatting && (
                      <div className='flex gap-3'>
                        <div className='w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200'>
                          <Sparkles className='w-3.5 h-3.5 text-indigo-600' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <div className='prose prose-sm max-w-none text-slate-700 leading-7'>
                            <ReactMarkdown
                              components={{
                                h1: ({ node, ...props }) => (
                                  <h1
                                    className='text-lg font-bold text-slate-900 mt-4 mb-2'
                                    {...props}
                                  />
                                ),
                                h2: ({ node, ...props }) => (
                                  <h2
                                    className='text-base font-bold text-slate-800 mt-3 mb-2'
                                    {...props}
                                  />
                                ),
                                strong: ({ node, ...props }) => (
                                  <span
                                    className='font-bold text-indigo-700'
                                    {...props}
                                  />
                                ),
                                ul: ({ node, ...props }) => (
                                  <ul
                                    className='list-disc pl-5 space-y-1 my-3 text-slate-600'
                                    {...props}
                                  />
                                ),
                                ol: ({ node, ...props }) => (
                                  <ol
                                    className='list-decimal pl-5 space-y-1 my-3 text-slate-600'
                                    {...props}
                                  />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className='pl-1' {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                  <p className='mb-3 last:mb-0' {...props} />
                                ),
                                // UPDATED CODE BLOCK RENDERER
                                code: ({
                                  node,
                                  inline,
                                  className,
                                  children,
                                  ...props
                                }: any) => {
                                  // Logic to distinguish inline code from block code
                                  const match = /language-(\w+)/.exec(
                                    className || '',
                                  );
                                  const isInline =
                                    inline ||
                                    (!match &&
                                      !String(children).includes('\n'));

                                  if (isInline) {
                                    return (
                                      <code
                                        className='bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs font-semibold'
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <CodeBlock className={className}>
                                      {children}
                                    </CodeBlock>
                                  );
                                },
                              }}
                            >
                              {answer}
                            </ReactMarkdown>
                          </div>
                          <div ref={chatEndRef} />
                        </div>
                      </div>
                    )}

                    {!answer && !isChatting && !chatError && (
                      <div className='flex flex-col items-center justify-center py-12 text-slate-400'>
                        <div className='bg-slate-100 p-3 rounded-full mb-3'>
                          <MessageSquare className='w-5 h-5 opacity-40' />
                        </div>
                        <p className='text-sm font-medium text-slate-500'>
                          Ask a question
                        </p>
                        <p className='text-xs opacity-60 mt-1 text-center max-w-xs'>
                          {activeScenario
                            ? 'Query the knowledge base to verify documentation accuracy.'
                            : 'Load a scenario from the control panel to get started.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className='p-3 bg-white border-t border-slate-100'>
                    <div className='flex gap-2'>
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                          activeScenario
                            ? "e.g. 'How do I process payments?' or 'What changed in v3?'"
                            : 'Load a scenario first...'
                        }
                        disabled={isChatting}
                        className='border-slate-200 focus-visible:ring-indigo-500 shadow-sm text-sm'
                      />
                      <Button
                        onClick={handleChat}
                        disabled={isChatting || !query.trim()}
                        className='bg-slate-900 hover:bg-slate-800 text-white shadow-sm px-3 cursor-pointer'
                        aria-label='Send message'
                      >
                        {isChatting ? (
                          <Spinner />
                        ) : (
                          <Send className='w-4 h-4' />
                        )}
                      </Button>
                    </div>
                    <p className='text-[10px] text-slate-400 mt-1.5 text-center'>
                      AI responses may be inaccurate. Always verify critical
                      information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- CODE BLOCK WITH COPY ---
function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isCopied, setIsCopied] = useState(false);
  const textContent = String(children).replace(/\n$/, '');

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className='relative my-4 group rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-lg'>
      <div className='flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800'>
        <div className='flex gap-1.5'>
          <div className='w-2.5 h-2.5 rounded-full bg-red-500/80' />
          <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/80' />
          <div className='w-2.5 h-2.5 rounded-full bg-green-500/80' />
        </div>
        <button
          onClick={onCopy}
          className='flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-400 text-[11px] transition-colors'
          aria-label='Copy code'
        >
          {isCopied ? (
            <>
              <Check className='w-3 h-3 text-green-400' />
              <span className='text-green-400'>Copied</span>
            </>
          ) : (
            <>
              <Copy className='w-3 h-3' />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className='p-4 overflow-x-auto text-slate-300 font-mono text-xs leading-relaxed selection:bg-indigo-500/30'>
        <code className={className}>{textContent}</code>
      </pre>
    </div>
  );
}
