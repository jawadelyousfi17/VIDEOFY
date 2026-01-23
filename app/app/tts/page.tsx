"use client";

import React, { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Play,
  RefreshCcw,
  FileAudio,
  Plus,
  Trash2,
  Mic,
  Save,
} from "lucide-react";
import {
  createTTSTask,
  getTTSTasks,
  getSavedVoices,
  saveVoice,
  deleteVoice,
} from "@/actions/tts/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

// Simple date formatter
const timeAgo = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString();
};

type Task = {
  id: string;
  prompt: string;
  voiceId: string;
  status: string;
  audioUrl: string | null;
  createdAt: Date;
};

type SavedVoice = {
  id: string;
  name: string;
  voiceId: string;
};

export default function TTSPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [savedVoices, setSavedVoices] = useState<SavedVoice[]>([]);

  const [prompt, setPrompt] = useState("");
  const [voiceId, setVoiceId] = useState("7f4ca2054e2d46e29785c4dc71257b7a");
  const [selectedVoiceTab, setSelectedVoiceTab] = useState("saved");

  // New Voice Saving State
  const [newVoiceName, setNewVoiceName] = useState("");
  const [isSavingVoice, startSaveVoiceTransition] = useTransition();

  const [isPending, startTransition] = useTransition();

  const fetchTasks = async () => {
    try {
      const data = await getTTSTasks();
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  };

  const fetchVoices = async () => {
    try {
      const data = await getSavedVoices();
      setSavedVoices(data);
      // If we have saved voices and current tab is saved, verify selection
      if (data.length > 0 && selectedVoiceTab === "saved") {
        // Optional: Auto select first if none selected
      }
    } catch (err) {
      console.error("Failed to fetch voices", err);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchVoices();
    const interval = setInterval(fetchTasks, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !voiceId.trim()) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("voiceId", voiceId);

      try {
        await createTTSTask(formData);
        setPrompt("");
        await fetchTasks();
      } catch (err) {
        console.error("Failed to create task", err);
        alert("Failed to create task");
      }
    });
  };

  const handleSaveVoice = async () => {
    if (!newVoiceName.trim() || !voiceId.trim()) return;
    startSaveVoiceTransition(async () => {
      const formData = new FormData();
      formData.append("name", newVoiceName);
      formData.append("voiceId", voiceId);

      const res = await saveVoice(formData);
      if (res.success) {
        setNewVoiceName("");
        await fetchVoices();
        setSelectedVoiceTab("saved");
      } else {
        alert(res.error || "Failed to save voice");
      }
    });
  };

  const handleDeleteVoice = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this voice?")) return;

    const formData = new FormData();
    formData.append("id", id);
    await deleteVoice(formData);
    await fetchVoices();
    if (voiceId === id) setVoiceId("");
  };

  return (
    <div className="container mx-auto py-8 space-y-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Text to Speech</h1>
        <p className="text-muted-foreground">
          Generate long-form speech using Fish Audio. Scripts are chunked and
          processed automatically.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>New Generation</CardTitle>
              <CardDescription>
                Write your script and select a voice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <Label>Voice Selection</Label>
                  <Tabs
                    value={selectedVoiceTab}
                    onValueChange={setSelectedVoiceTab}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="saved">Saved Voices</TabsTrigger>
                      <TabsTrigger value="custom">Custom ID</TabsTrigger>
                    </TabsList>

                    <TabsContent value="saved" className="space-y-4 pt-4">
                      {savedVoices.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                          <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No saved voices found.</p>
                          <Button
                            variant="link"
                            onClick={() => setSelectedVoiceTab("custom")}
                          >
                            Add one via Custom ID
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {savedVoices.map((voice) => (
                            <div
                              key={voice.id}
                              className={`
                                                relative p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent
                                                ${voiceId === voice.voiceId ? "border-primary bg-accent" : "border-transparent bg-muted"}
                                            `}
                              onClick={() => setVoiceId(voice.voiceId)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-sm truncate pr-2">
                                  {voice.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                  onClick={(e) =>
                                    handleDeleteVoice(voice.id, e)
                                  }
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-1">
                                {voice.voiceId}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="custom" className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Fish Audio Voice ID</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter Voice ID (e.g. 7f4ca...)"
                            value={voiceId}
                            onChange={(e) => setVoiceId(e.target.value)}
                            className="font-mono text-sm"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Find voice IDs on the Fish Audio platform.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
                        <div className="flex items-center gap-2">
                          <Save className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Save this voice
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Give it a name (e.g. My Narrator)"
                            value={newVoiceName}
                            onChange={(e) => setNewVoiceName(e.target.value)}
                            className="bg-background"
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleSaveVoice}
                            disabled={
                              !voiceId || !newVoiceName || isSavingVoice
                            }
                          >
                            {isSavingVoice ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label>Script</Label>
                  <Textarea
                    placeholder="Enter your text here... (Long texts are supported)"
                    className="min-h-[200px] resize-y"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    required
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Supports auto-chunking for long texts.</span>
                    <span>{prompt.length} chars</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isPending || !voiceId}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">History</h2>
            <Button variant="ghost" size="sm" onClick={fetchTasks}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {tasks.length === 0 && (
              <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                <FileAudio className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No history yet.</p>
              </div>
            )}
            {tasks.map((task) => (
              <Card key={task.id} className="overflow-hidden bg-muted/10">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        task.status === "COMPLETED"
                          ? "default"
                          : task.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                      className="uppercase text-[10px]"
                    >
                      {task.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(task.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm line-clamp-2 text-muted-foreground italic">
                    "{task.prompt}"
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mic className="h-3 w-3" />
                    <span className="truncate max-w-[150px] font-mono">
                      {task.voiceId}
                    </span>
                  </div>

                  {task.status === "COMPLETED" && task.audioUrl && (
                    <div className="pt-2">
                      <audio controls className="w-full h-8 block">
                        <source src={task.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      <a
                        href={task.audioUrl}
                        download
                        className="text-xs text-primary hover:underline mt-1 block w-fit"
                      >
                        Download MP3
                      </a>
                    </div>
                  )}

                  {task.status === "FAILED" && (
                    <p className="text-xs text-red-500">
                      Generation failed. Please try again.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
