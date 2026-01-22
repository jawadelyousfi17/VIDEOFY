"use client";

import React, { Dispatch, SetStateAction, useState } from "react";
import { generateTitleAndDescription } from "@/actions/anthropic";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Sparkles } from "lucide-react";

const GenerateMetadataStep = ({
  script,
  title,
  setTitle,
  description,
  setDescription,
}: {
  script: string;
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
}) => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!script.trim()) return;

    setLoading(true);
    try {
      const result = await generateTitleAndDescription(script);
      setTitle(result.title);
      setDescription(result.description);
    } catch (error) {
      console.error("Error generating metadata:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Video Title & Description
        </h2>
        <p className="text-muted-foreground">
          Generate SEO-optimized metadata for your video using AI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metadata Generation</CardTitle>
          <CardDescription>
            Create a catchy title and detailed description based on your script.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!script.trim() ? (
            <div className="text-center p-4 text-amber-500 bg-amber-500/10 rounded-lg">
              Please generate a script in the previous steps first.
            </div>
          ) : (
            <div className="flex justify-center pb-4">
              <Button
                onClick={handleGenerate}
                disabled={loading}
                size="lg"
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Generating Metadata...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Metadata with AI
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your catchy video title..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Video Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed video description..."
              className="min-h-[200px]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GenerateMetadataStep;
