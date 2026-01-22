"use client";

import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { YoutubeLink } from "../../page";
import { getYouTubeTranscript } from "@/actions/youtube-transcript";
import { generateScript } from "@/actions/anthropic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, Copy, Sparkles, XCircle } from "lucide-react";

const TONES = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "humorous", label: "Humorous" },
  { id: "educational", label: "Educational" },
] as const;

type ScriptData = {
  title: string;
  script: string;
};

type SourceStatus = "idle" | "loading" | "done" | "error";

type SourceTranscript = {
  url: string;
  title: string;
  status: SourceStatus;
  script: string;
  error?: string;
};

const GenerateScriptStep = ({
  idea,
  youtubeLinks,
  setScript,
}: {
  idea: string;
  youtubeLinks: YoutubeLink[];
  setScript: Dispatch<SetStateAction<string>>;
}) => {
  const [loadingTranscripts, setLoadingTranscripts] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);

  const [tone, setTone] = useState<(typeof TONES)[number]["id"]>("casual");
  const [complexity, setComplexity] = useState(5);
  const [lengthInMinutes, setLengthInMinutes] = useState(2);

  const [sources, setSources] = useState<SourceTranscript[]>([]);
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [draftScript, setDraftScript] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const lastAutoGenerateKey = useRef<string>("");

  // Sync draft script to parent
  useEffect(() => {
    setScript(draftScript);
  }, [draftScript, setScript]);

  useEffect(() => {
    const next = youtubeLinks
      .map((l) => ({
        url: (l.url || "").trim(),
        title: (l.title || "").trim(),
      }))
      .filter((l) => l.url.length > 0);

    setSources((prev) => {
      const prevByUrl = new Map(prev.map((p) => [p.url, p] as const));

      return next.map((l) => {
        const existing = prevByUrl.get(l.url);
        return {
          url: l.url,
          title: l.title || existing?.title || "Untitled video",
          status: existing?.script ? "done" : "idle",
          script: existing?.script || "",
          error: existing?.error,
        } satisfies SourceTranscript;
      });
    });
  }, [youtubeLinks]);

  const fetchTranscripts = useCallback(async (urls: string[]) => {
    if (urls.length === 0) return;

    setLoadingTranscripts(true);
    setSources((prev) =>
      prev.map((s) =>
        urls.includes(s.url)
          ? { ...s, status: "loading", error: undefined }
          : s,
      ),
    );

    try {
      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const script = await getYouTubeTranscript(url);
          return { url, script };
        }),
      );

      setSources((prev) => {
        const next = [...prev];
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          if (r.status === "fulfilled") {
            const idx = next.findIndex((s) => s.url === r.value.url);
            if (idx >= 0) {
              next[idx] = {
                ...next[idx],
                status: "done",
                script: r.value.script,
                error: undefined,
              };
            }
            continue;
          }

          // rejected
          const reason = r.reason as any;
          const message =
            typeof reason?.message === "string"
              ? reason.message
              : "Failed to fetch transcript";
          const failedUrl = urls[i];
          const idx = next.findIndex((s) => s.url === failedUrl);
          if (idx >= 0) {
            next[idx] = { ...next[idx], status: "error", error: message };
          }
        }
        return next;
      });
    } finally {
      setLoadingTranscripts(false);
    }
  }, []);

  useEffect(() => {
    const toFetch = sources
      .filter((s) => s.status === "idle")
      .map((s) => s.url);
    if (toFetch.length === 0) return;
    if (loadingTranscripts) return;
    fetchTranscripts(toFetch);
  }, [sources, loadingTranscripts, fetchTranscripts]);

  const inspirationScripts: ScriptData[] = useMemo(() => {
    return sources
      .filter((s) => s.status === "done" && s.script.trim().length > 0)
      .map((s) => ({ title: s.title, script: s.script }));
  }, [sources]);

  const stats = useMemo(() => {
    const total = sources.length;
    const done = sources.filter((s) => s.status === "done").length;
    const error = sources.filter((s) => s.status === "error").length;
    const loading = sources.filter((s) => s.status === "loading").length;
    return { total, done, error, loading };
  }, [sources]);

  const handleGenerateScript = useCallback(async () => {
    if (!idea.trim()) return;
    if (inspirationScripts.length === 0) return;

    setLoadingScript(true);
    try {
      const result = await generateScript({
        idea: idea,
        inspirationScripts,
        lengthInMinutes,
        tone,
        complexity,
      });

      setGeneratedScript(result.script);
      setDraftScript(result.script);
      console.log("Generated Script:", result.script);
      console.log("Token Usage:", result.usage);
    } catch (error) {
      console.error("Error generating script:", error);
    } finally {
      setLoadingScript(false);
    }
  }, [idea, inspirationScripts, lengthInMinutes, tone, complexity]);

  const estimatedWords = Math.max(1, Math.round(lengthInMinutes * 150));

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(draftScript || generatedScript);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  }, [draftScript, generatedScript]);

  const hasIdea = idea.trim().length > 0;
  const hasLinks = sources.length > 0;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Generate Script</h2>
          <p className="text-sm text-muted-foreground">
            We’ll learn from your inspiration videos, then write a TTS-ready
            script.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loadingTranscripts && (
            <Badge variant="outline" className="gap-2">
              <Spinner className="size-3" />
              Getting inspiration…
            </Badge>
          )}
          {loadingScript && (
            <Badge variant="outline" className="gap-2">
              <Spinner className="size-3" />
              Writing with Claude…
            </Badge>
          )}
          {!loadingTranscripts && !loadingScript && generatedScript && (
            <Badge className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Script ready
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-muted bg-background/50 p-6 space-y-6">
            <div className="space-y-1.5">
              <h3 className="font-semibold leading-none tracking-tight">
                Settings
              </h3>
              <p className="text-sm text-muted-foreground">
                Fine-tune tone, complexity, and length.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-end justify-between gap-3">
                  <div className="space-y-1">
                    <Label>Reading length (minutes)</Label>
                    <p className="text-xs text-muted-foreground">
                      Roughly {estimatedWords} words.
                    </p>
                  </div>
                  <div className="w-30">
                    <Input
                      inputMode="numeric"
                      type="number"
                      min={1}
                      max={20}
                      value={lengthInMinutes}
                      onChange={(e) =>
                        setLengthInMinutes(
                          Math.min(
                            20,
                            Math.max(1, Number(e.target.value || 1)),
                          ),
                        )
                      }
                      className="h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tone</Label>
                <Tabs value={tone} onValueChange={(v) => setTone(v as any)}>
                  <TabsList className="grid grid-cols-2">
                    {TONES.map((t) => (
                      <TabsTrigger key={t.id} value={t.id}>
                        {t.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Complexity</Label>
                  <Badge variant="outline">{complexity}/10</Badge>
                </div>
                <Slider
                  value={[complexity]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(v) => setComplexity(v[0] ?? 5)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleGenerateScript}
                disabled={
                  loadingScript ||
                  loadingTranscripts ||
                  !hasIdea ||
                  inspirationScripts.length === 0
                }
              >
                {loadingScript ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Script
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-muted bg-background/50 p-6 space-y-6">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold leading-none tracking-tight">
                  Inspiration
                </h3>
                <Badge variant="outline">
                  {stats.done}/{stats.total}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Transcripts are used to match the pacing and style.
              </p>
            </div>
            <div className="space-y-3">
              {!hasLinks && (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Add at least one YouTube link in Step 1.
                </div>
              )}

              {hasLinks && (
                <div className="space-y-2">
                  {sources.map((s) => (
                    <div
                      key={s.url}
                      className="flex items-start justify-between gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.title || "Untitled video"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {s.url}
                        </div>
                        {s.status === "error" && s.error && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2">
                            {s.error}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {s.status === "loading" && (
                          <Badge variant="outline" className="gap-2">
                            <Spinner className="size-3" />
                            Fetching
                          </Badge>
                        )}
                        {s.status === "done" && (
                          <Badge className="gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Ready
                          </Badge>
                        )}
                        {s.status === "error" && (
                          <Badge variant="destructive" className="gap-2">
                            <XCircle className="h-4 w-4" />
                            Failed
                          </Badge>
                        )}
                        {s.status === "idle" && (
                          <Badge variant="outline">Queued</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-background/50 h-full flex flex-col gap-6">
            <div className="space-y-1.5 px-1">
              <h3 className="font-semibold leading-none tracking-tight">
                Script
              </h3>
              <p className="text-sm text-muted-foreground">
                Output is raw text, ready for TTS.
              </p>
            </div>
            <div className="space-y-4 pt-0">
              {!hasIdea && (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Add your idea in Step 2 to generate a script.
                </div>
              )}

              {hasIdea &&
                inspirationScripts.length === 0 &&
                !loadingTranscripts && (
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
                    We need at least one successfully fetched transcript to
                    match your inspiration.
                  </div>
                )}

              {(loadingTranscripts || loadingScript) && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Spinner />
                    {loadingTranscripts
                      ? `Getting inspiration… (${stats.done}/${stats.total})`
                      : "Generating your script with Claude…"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    This can take a few seconds.
                  </div>
                </div>
              )}

              {generatedScript && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      {draftScript.trim().length.toLocaleString()} characters
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        disabled={!(draftScript || generatedScript)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setGeneratedScript("");
                          setDraftScript("");
                          lastAutoGenerateKey.current = "";
                          handleGenerateScript();
                        }}
                        disabled={
                          loadingScript || inspirationScripts.length === 0
                        }
                        className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  <Textarea
                    value={draftScript}
                    onChange={(e) => setDraftScript(e.target.value)}
                    className="min-h-90 text-sm leading-relaxed"
                    placeholder="Your script will appear here…"
                  />
                </div>
              )}

              {!generatedScript &&
                hasIdea &&
                inspirationScripts.length > 0 &&
                !loadingScript &&
                !loadingTranscripts && (
                  <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Ready to write</div>
                      <div className="text-xs text-muted-foreground">
                        Using {inspirationScripts.length} inspiration transcript
                        {inspirationScripts.length > 1 ? "s" : ""}.
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleGenerateScript}
                      disabled={loadingScript}
                      className="bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateScriptStep;
