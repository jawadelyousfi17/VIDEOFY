"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createVideo } from "@/actions/video-services/create-video";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  CheckCircle2,
  Download,
  Film,
  Play,
  Pause,
  Sparkles,
} from "lucide-react";

type AudioData = {
  filePath: string;
  format: string;
  size: number;
  duration: number;
};

const GenerateVideoStep = ({
  audioData,
  onVideoGenerated,
}: {
  audioData: AudioData | null;
  onVideoGenerated?: (path: string) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState<{
    video: string;
    format: string;
    size: number;
    duration: number;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasAudio = audioData !== null;

  const handleGenerate = useCallback(async () => {
    if (!audioData) {
      console.error("No audio data available");
      return;
    }

    if (!audioData.filePath) {
      console.error("Audio file path is missing in audioData", audioData);
      return;
    }

    setLoading(true);
    try {
      console.log("Generating video with audio:", audioData.filePath);
      const result = await createVideo({
        demoVideoUrl: "public/videos/0122.mov",
        audioFilePath: audioData.filePath,
        audioDuration: audioData.duration,
      });

      setVideoData(result);
      if (result.filePath && onVideoGenerated) {
        onVideoGenerated(result.filePath);
      }
      console.log("Generated Video:", {
        format: result.format,
        size: result.size,
        duration: result.duration,
      });
    } catch (error) {
      console.error("Error generating video:", error);
    } finally {
      setLoading(false);
    }
  }, [audioData]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleDownload = () => {
    if (!videoData) return;

    const blob = new Blob(
      [Uint8Array.from(atob(videoData.video), (c) => c.charCodeAt(0))],
      { type: "video/mp4" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `final-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Generate Video</h2>
          <p className="text-sm text-muted-foreground">
            Combine your voiceover with looping background video.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {loading && (
            <Badge variant="outline" className="gap-2">
              <Spinner className="size-3" />
              Rendering video…
            </Badge>
          )}
          {!loading && videoData && (
            <Badge className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Video ready
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Video Settings</CardTitle>
            <CardDescription>
              Your voiceover will be synced with the demo video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasAudio && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                Complete Step 4 to generate audio first.
              </div>
            )}

            {hasAudio && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Audio Duration
                      </span>
                      <Badge variant="outline">
                        {formatTime(audioData.duration)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Audio Size</span>
                      <Badge variant="outline">
                        {formatBytes(audioData.size)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Demo Video</span>
                      <Badge variant="outline">demo.mp4</Badge>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-blue-50 dark:bg-blue-900/10 p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                        How it works
                      </p>
                      <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
                        The demo video will loop automatically to match your
                        audio duration, then both will be merged into a final
                        MP4 file.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerate}
              disabled={loading || !hasAudio}
              className="w-full bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white"
            >
              <Film className="h-4 w-4 mr-2" />
              {loading ? "Generating Video..." : "Generate Video"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Video Output</CardTitle>
            <CardDescription>
              Preview and download your final video.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!videoData && !loading && (
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Your video will appear here after generation
                </p>
              </div>
            )}

            {loading && (
              <div className="rounded-lg border bg-muted/20 p-8 text-center">
                <Spinner className="h-8 w-8 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Rendering your video with FFmpeg...
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  This may take a few minutes depending on length
                </p>
              </div>
            )}

            {videoData && (
              <div className="space-y-4">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        src={`data:video/mp4;base64,${videoData.video}`}
                        onPlay={() => setPlaying(true)}
                        onPause={() => setPlaying(false)}
                        controls
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {formatBytes(videoData.size)}
                        </Badge>
                        <Badge variant="outline">
                          {formatTime(videoData.duration)}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download MP4
                      </Button>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Regenerate Video
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenerateVideoStep;
