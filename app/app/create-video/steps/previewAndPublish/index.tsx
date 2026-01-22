"use client";

import React, { useState } from "react";
import { uploadVideoToYouTube } from "@/actions/youtube-upload";
import { uploadFile } from "@/actions/utility/upload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Youtube,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  MoreVertical,
} from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

export const PreviewAndPublishStep = ({
  videoPath,
  title,
  description,
}: {
  videoPath: string | null;
  title: string;
  description: string;
}) => {
  const [uploading, setUploading] = useState(false);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!videoPath || !title || !description) return;

    setUploading(true);
    try {
      let thumbnailPath: string | undefined = undefined;

      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        try {
          thumbnailPath = await uploadFile(formData);
        } catch (error) {
          console.error("Error uploading thumbnail file:", error);
          alert(
            "Failed to upload thumbnail image. Proceeding with video only.",
          );
        }
      }

      const result = await uploadVideoToYouTube({
        videoPath,
        title,
        description,
        tags: ["AI Video", "Generated Content"],
        thumbnailPath,
      });

      if (result.success) {
        setLastUploadedUrl(result.url);
      }
    } catch (error) {
      console.error("Error uploading to YouTube:", error);
      alert("Failed to upload video. Check console/server logs for details.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Preview & Publish</h2>
        <p className="text-muted-foreground">
          Review how your video will look on YouTube and publish it.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thumbnail</CardTitle>
              <CardDescription>
                Upload a custom thumbnail for your video.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div
                  className="aspect-video w-full bg-muted rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center relative overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors group"
                  onClick={() =>
                    document.getElementById("thumbnail-upload")?.click()
                  }
                >
                  {thumbnailPreview ? (
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground">
                      <ImageIcon className="h-10 w-10" />
                      <span>Click to upload thumbnail</span>
                    </div>
                  )}
                  <Input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>
                {thumbnailFile && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Selected: {thumbnailFile.name}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publish Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {!videoPath ? (
                  <div className="text-sm text-muted-foreground italic">
                    Video generation must be completed before uploading.
                  </div>
                ) : lastUploadedUrl ? (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex flex-col items-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                    <h3 className="font-semibold text-green-700">
                      Video Uploaded Successfully!
                    </h3>
                    <a
                      href={lastUploadedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Watch on YouTube
                    </a>
                  </div>
                ) : (
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !title || !description}
                    className="bg-red-600 hover:bg-red-700 text-white w-full"
                    size="lg"
                  >
                    {uploading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 text-white" />
                        Uploading to YouTube...
                      </>
                    ) : (
                      <>
                        <Youtube className="mr-2 h-4 w-4" />
                        Upload to YouTube
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: YouTube Preview Card */}
        <div className="space-y-6">
          <Label className="text-lg font-semibold">YouTube Preview</Label>
          <div className="border rounded-xl overflow-hidden bg-card text-card-foreground shadow-sm max-w-[400px] mx-auto lg:mx-0">
            {/* Video Thumbnail Area */}
            <div className="aspect-video w-full bg-black relative">
              {thumbnailPreview ? (
                <Image
                  src={thumbnailPreview}
                  alt="Thumbnail"
                  fill
                  className="object-cover opacity-90"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/50">
                  <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[16px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                10:25
              </div>
            </div>

            {/* Video Info Area */}
            <div className="p-3 flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-slate-200"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">
                  {title || "Video Title Goes Here"}
                </h3>
                <div className="text-xs text-muted-foreground flex flex-col">
                  <span>Channel Name</span>
                  <div className="flex items-center">
                    <span>12K views</span>
                    <span className="mx-1">•</span>
                    <span>2 hours ago</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <h4 className="font-semibold mb-2">Description Preview:</h4>
            <p className="line-clamp-4 whitespace-pre-wrap">
              {description || "Video description will appear here..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
