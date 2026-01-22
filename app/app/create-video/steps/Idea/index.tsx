"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Target, Mic, Lightbulb } from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@/components/ui/button";

const TONES = [
  { id: "casual", label: "Casual" },
  { id: "professional", label: "Professional" },
  { id: "humorous", label: "Humorous" },
  { id: "educational", label: "Educational" },
];

const IdeaStep = ({
  idea,
  setIdea,
}: {
  idea: string;
  setIdea: Dispatch<SetStateAction<string>>;
}) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-xl font-bold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              What's your video idea?
            </Label>
            <p className="text-sm text-muted-foreground">
              Describe what you want to create in a few sentences.
            </p>
          </div>
          <Badge variant="outline" className="h-fit">
            AI Enhanced
          </Badge>
        </div>

        <div className="relative">
          <Textarea
            placeholder="e.g., A 60-second tutorial on how to bake sourdough bread for beginners..."
            className="min-h-[150px] text-lg p-4 resize-none focus-visible:ring-1 transition-all"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <Button variant="ghost" className="text-sm shadow-none" size="sm">
              {idea.length} characters{" "}
            </Button>

            <div>
              <Button
                className="text-sm shadow-none bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 text-white border-none transition-all duration-300"
                size="sm"
              >
                <Sparkles className="h-4 w-4" />
                Enhance with AI
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Tone Selection */}

        {/* Audience / Complexity */}
      </div>
      {/* Suggested Improvements */}
      {idea.length > 10 && idea.length < 60 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3 animate-in zoom-in-95 duration-300">
          <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Make it even better
            </p>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed">
              Try adding specific details about your <b>target audience</b> or
              the <b>primary goal</b> of the video (e.g., to sell, to entertain,
              or to educate).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaStep;
