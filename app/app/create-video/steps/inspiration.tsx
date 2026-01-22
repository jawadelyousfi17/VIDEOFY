import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { YoutubeLink } from "../page";
import { Button } from "@/components/ui/button";
import YoutubeLinksCard from "../_cards/youtubeLinksCard";
import { getPresets, savePreset } from "@/actions/presets";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bookmark, ChevronDown, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";

const InspirationStep = ({
  youtubeLinks,
  setYoutubeLinks,
}: {
  youtubeLinks: YoutubeLink[];
  setYoutubeLinks: Dispatch<SetStateAction<YoutubeLink[]>>;
}) => {
  const [presets, setPresets] = useState<any[]>([]);
  const [presetName, setPresetName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);

  useEffect(() => {
    getPresets().then(setPresets);
  }, []);

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    setIsSaving(true);
    try {
      const validLinks = youtubeLinks.filter((l) => l.url.trim() !== "");
      if (validLinks.length === 0) {
        alert("Add at least one video link to save a preset.");
        return;
      }
      await savePreset(presetName, validLinks);
      setPresetName("");
      setShowSaveInput(false);
      getPresets().then(setPresets);
    } catch (error) {
      console.error(error);
      alert("Failed to save preset");
    } finally {
      setIsSaving(false);
    }
  };

  const loadPreset = (preset: any) => {
    if (preset.links && preset.links.length > 0) {
      setYoutubeLinks(
        preset.links.map((l: any) => ({
          url: l.url,
          title: l.title,
          thumbnail: l.thumbnail,
        })),
      );
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Inspired from Youtube Video</span>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Bookmark className="h-4 w-4" />
                  Load Preset
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Saved Presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {presets.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground">
                    No presets found
                  </div>
                ) : (
                  presets.map((preset) => (
                    <DropdownMenuItem
                      key={preset.id}
                      onClick={() => loadPreset(preset)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {preset.links.length} videos
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {!showSaveInput ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveInput(true)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Preset
              </Button>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5">
                <Input
                  placeholder="Preset Name"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="h-8 w-40"
                />
                <Button
                  size="sm"
                  onClick={handleSavePreset}
                  disabled={isSaving}
                >
                  {isSaving ? <Spinner className="h-3 w-3" /> : "Save"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaveInput(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            <Button
              onClick={() => {
                setYoutubeLinks((prev) => [{ url: "" }, ...prev]);
              }}
            >
              Add new video
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {youtubeLinks.map((linkData, index) => (
            <YoutubeLinksCard
              enter={() => {
                setYoutubeLinks((prev) => [{ url: "" }, ...prev]);
              }}
              key={index}
              index={index}
              linkData={linkData}
              setLink={setYoutubeLinks}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InspirationStep;
