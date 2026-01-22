"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { generateSpeech } from "@/actions/fish-audio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle2,
  Download,
  Mic,
  Play,
  Pause,
  Volume2,
} from "lucide-react";

const PRESET_VOICES = [
  { id: "99d64252722b410a84f6dfae21756c36", name: "Psychology Girl" },
  { id: "cd8978d42e1d40bd87056fd79ee9208c", name: "11 labs mark" },
];

const GenerateAudioStep = ({
  script,
  onAudioGenerated,
}: {
  script: string;
  onAudioGenerated?: (data: {
    filePath: string;
    format: string;
    size: number;
    duration: number;
  }) => void;
}) => {
  const [voiceId, setVoiceId] = useState("99d64252722b410a84f6dfae21756c36");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioData, setAudioData] = useState<{
    filePath: string;
    publicUrl: string;
    format: string;
    size: number;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const hasScript = script.trim().length > 0;
  const selectedVoice = PRESET_VOICES.find((v) => v.id === voiceId);
  const effectiveVoiceId = voiceId === "custom" ? customVoiceId : voiceId;

  const handleGenerate = useCallback(async () => {
    if (!script.trim() || !effectiveVoiceId.trim()) return;

    setLoading(true);
    try {
      const result = await generateSpeech({
        voiceId: effectiveVoiceId.trim(),
        content: script,
      });

      setAudioData(result);
      console.log("Generated Audio:", {
        format: result.format,
        size: result.size,
      });
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setLoading(false);
    }
  }, [script, effectiveVoiceId]);

  useEffect(() => {
    if (!audioData || !audioRef.current) return;

    const audio = audioRef.current;

    // Using the public URL for playback which avoids big base64 strings
    audio.src = audioData.publicUrl;

    const handleLoadedMetadata = async () => {
      setDuration(audio.duration);

      // Notify parent component that audio is ready with duration
      if (audioData && onAudioGenerated) {
        onAudioGenerated({
          filePath: audioData.filePath,
          format: audioData.format,
          size: audioData.size,
          duration: audio.duration,
        });
      }
    };
    // No more manual saving or error handling here for save, server did it.

    // Listeners below...
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioData, onAudioGenerated]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleDownload = () => {
    if (!audioData) return;

    const a = document.createElement("a");
    a.href = audioData.publicUrl;
    a.download = `voiceover-${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Generate Voice</h2>
          <p className="text-sm text-muted-foreground">
            Convert your script into natural-sounding speech with Fish Audio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <Badge variant="outline" className="gap-2">
              <Spinner className="size-3" />
              Generating audio…
            </Badge>
          )}
          {!loading && audioData && (
            <Badge className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Audio ready
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Voice Settings</CardTitle>
            <CardDescription>
              Select a voice model to narrate your script.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGenerate}
              disabled={loading || !hasScript || !voiceId.trim()}
              className="w-full bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate Audio"}
            </Button>
            <div className="space-y-2">
              <Label>Select Voice</Label>
              <div className="grid gap-2">
                {PRESET_VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setVoiceId(voice.id)}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      voiceId === voice.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          voiceId === voice.id ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <Mic
                          className={`h-5 w-5 ${
                            voiceId === voice.id
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{voice.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {voice.id.substring(0, 16)}...
                        </div>
                      </div>
                    </div>
                    {voiceId === voice.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}

                <button
                  onClick={() => setVoiceId("custom")}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    voiceId === "custom"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        voiceId === "custom" ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <Mic
                        className={`h-5 w-5 ${
                          voiceId === "custom"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Custom Voice</div>
                      <div className="text-xs text-muted-foreground">
                        Use your own voice ID
                      </div>
                    </div>
                  </div>
                  {voiceId === "custom" && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>
              </div>
            </div>

            {voiceId === "custom" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="customVoiceId">Custom Voice ID</Label>
                <Input
                  id="customVoiceId"
                  placeholder="e.g., 7f92f8afb8ec43bf81429cc1c9199cb1"
                  value={customVoiceId}
                  onChange={(e) => setCustomVoiceId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your voice ID from Fish Audio dashboard
                </p>
              </div>
            )}

            {selectedVoice && voiceId !== "custom" && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">Selected</Badge>
                  <span className="font-medium">{selectedVoice.name}</span>
                </div>
              </div>
            )}

            {!hasScript && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Complete Step 3 to generate a script first.
              </div>
            )}

            {hasScript && (
              <div className="space-y-2">
                <Label>Script Preview</Label>
                <div className="rounded-lg border bg-muted/20 p-3 max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">
                    {script.substring(0, 300)}
                    {script.length > 300 && "..."}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {script.length.toLocaleString()} characters
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Output</CardTitle>
            <CardDescription>
              {/* Preview and download your generated voiceover. */}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={handleGenerate}
              disabled={loading || !hasScript || !voiceId.trim()}
              className="w-full bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              {loading ? "Generating..." : "Generate Audio"}
            </Button>
            {!audioData && !loading && (
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <Volume2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Your audio will appear here after generation
                </p>
              </div>
            )}

            {loading && (
              <div className="rounded-lg border bg-muted/20 p-8 text-center">
                <Spinner className="h-8 w-8 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Generating voiceover with Fish Audio...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take a minute or two
                </p>
              </div>
            )}

            {audioData && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">voiceover.mp3</span>
                    </div>
                    <Badge variant="outline">
                      {formatBytes(audioData.size)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={togglePlay}
                        className="shrink-0"
                      >
                        {playing ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <div className="flex-1 space-y-1">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-100"
                            style={{
                              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download MP3
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Regenerate Audio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default GenerateAudioStep;
