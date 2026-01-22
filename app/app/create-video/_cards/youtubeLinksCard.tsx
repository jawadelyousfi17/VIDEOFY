"use client";

import { Input } from "@/components/ui/input";
import { Trash2, Loader2, Clipboard } from "lucide-react";
import { Dispatch, SetStateAction, useState, useEffect } from "react";
import { BsYoutube } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import { getYoutubePreview } from "@/actions/youtube-preview";
import { YoutubeLink } from "../page";

const YoutubeLinksCard = ({
  index,
  linkData,
  setLink,
  enter,
}: {
  index: number;
  linkData: YoutubeLink;
  setLink: Dispatch<SetStateAction<YoutubeLink[]>>;
  enter: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  const fetchPreview = async (url: string) => {
    if (!url || (!url.includes("youtube.com") && !url.includes("youtu.be")))
      return;
    setLoading(true);
    const data = await getYoutubePreview(url);
    if (data) {
      setLink((prev) => {
        const newLinks = [...prev];
        newLinks[index] = {
          ...newLinks[index],
          title: data.title,
          thumbnail: data.thumbnail,
        };
        return newLinks;
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLink((prev) => {
      const newLinks = [...prev];
      newLinks[index] = { ...newLinks[index], url: newVal };
      return newLinks;
    });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      await fetchPreview(linkData.url);
      enter();
    }
  };

  const handleNativePaste = async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text && (text.includes("youtube.com") || text.includes("youtu.be"))) {
      // Small delay to let the state update from the native paste or manually update it
      setLink((prev) => {
        const newLinks = [...prev];
        newLinks[index] = { ...newLinks[index], url: text };
        return newLinks;
      });
      await fetchPreview(text);
      enter();
    }
  };

  const handleDelete = () => {
    setLink((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLink((prev) => {
          const newLinks = [...prev];
          newLinks[index] = { ...newLinks[index], url: text };
          return newLinks;
        });
        // Auto fetch preview if pasted text looks like a URL
        if (text.includes("youtube.com") || text.includes("youtu.be")) {
          await fetchPreview(text);
          enter();
        }
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 border rounded-lg bg-background hover:bg-accent/50 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-red-600" />
          ) : (
            <BsYoutube className="h-5 w-5 text-red-600 dark:text-red-500" />
          )}
        </div>

        <div className="flex-1">
          <Input
            onKeyDown={handleKeyDown}
            onPaste={handleNativePaste}
            value={linkData.url}
            onChange={handleChange}
            placeholder="Paste YouTube URL here and press Enter..."
            className="border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-auto sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={handlePaste}
            title="Paste from clipboard"
          >
            Paste link
            <Clipboard className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remove link</span>
          </Button>
        </div>
      </div>

      {linkData.title && linkData.thumbnail && (
        <div className="flex gap-3 mt-1 p-2 rounded-md bg-muted/50 items-center animate-in fade-in zoom-in-95 duration-200">
          <img
            src={linkData.thumbnail}
            alt={linkData.title}
            className="h-12 w-20 object-cover rounded shadow-sm flex-shrink-0"
          />
          <div className="text-xs font-medium line-clamp-2 text-muted-foreground">
            {linkData.title}
          </div>
        </div>
      )}
    </div>
  );
};

export default YoutubeLinksCard;
