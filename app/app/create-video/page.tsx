"use client";

import Step from "@/components/custom/step";
import { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import YoutubeLinksCard from "./_cards/youtubeLinksCard";
import { Button } from "@/components/ui/button";
import InspirationStep from "./steps/inspiration";
import IdeaStep from "./steps/Idea";
import GenerateScriptStep from "./steps/generateScript";
import GenerateAudioStep from "./steps/generateAudio";
import GenerateVideoStep from "./steps/generateVideo";
import GenerateMetadataStep from "./steps/generateMetadata";
import { PreviewAndPublishStep } from "./steps/previewAndPublish";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STEPS = [
  { title: "Inspiration", step: 1 },
  { title: "Idea", step: 2 },
  { title: "Edit script", step: 3 },
  { title: "Generate voice", step: 4 },
  { title: "Generate Video", step: 5 },
  { title: "Metadata", step: 6 },
  { title: "Publish", step: 7 },
];

export type YoutubeLink = {
  url: string;
  title?: string;
  thumbnail?: string;
};

const Page = () => {
  const [youtubeLinks, setYoutubeLinks] = useState<YoutubeLink[]>([]);
  const [idea, setIdea] = useState(
    "the routine shift that guarantees consistency",
  );

  const [script, setScript] = useState("");
  const [audioData, setAudioData] = useState<{
    filePath: string;
    format: string;
    size: number;
    duration: number;
  } | null>(null);
  const [videoPath, setVideoPath] = useState<string | null>(null);

  // Metadata state lifted up
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");

  const [step, setStep] = useState(1);

  return (
    <div className="max-w-6xl mx-auto px-4 py-3">
      <div className="flex flex-col gap-8">
        {/* Header */}
        {/* <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <IoArrowBack className="text-2xl" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Video
          </h1>
        </div> */}

        {/* Steps Indicator */}
        <div className="w-full overflow-x-auto pb-4 pt-2">
          <div className="relative flex justify-between items-start min-w-[800px] px-8">
            {/* Background Line */}
            <div className="absolute top-5 left-8 right-8 h-[2px] bg-muted -z-10" />
            {/* Progress Line */}
            <div
              className="absolute top-5 left-8 h-[2px] bg-primary -z-10 transition-all duration-500 ease-in-out"
              style={{
                width: `calc(${
                  ((step - 1) / (STEPS.length - 1)) * 100
                }% - 4rem)`,
              }}
            />

            {STEPS.map((s) => (
              <Step
                key={s.step}
                step={s.step}
                currentStep={step}
                title={s.title}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[500px]  rounded-xl bg-card  animate-in fade-in duration-500">
          {step === 1 && (
            <InspirationStep
              setYoutubeLinks={setYoutubeLinks}
              youtubeLinks={youtubeLinks}
            />
          )}
          {step === 2 && <IdeaStep idea={idea} setIdea={setIdea} />}
          {step === 3 && (
            <GenerateScriptStep
              idea={idea}
              youtubeLinks={youtubeLinks}
              setScript={setScript}
            />
          )}
          {step === 4 && (
            <GenerateAudioStep
              script={script}
              onAudioGenerated={setAudioData}
            />
          )}
          {step === 5 && (
            <GenerateVideoStep
              audioData={audioData}
              onVideoGenerated={(path) => setVideoPath(path)}
            />
          )}
          {step === 6 && (
            <GenerateMetadataStep
              script={script}
              title={videoTitle}
              setTitle={setVideoTitle}
              description={videoDescription}
              setDescription={setVideoDescription}
            />
          )}
          {step === 7 && (
            <PreviewAndPublishStep
              videoPath={videoPath}
              title={videoTitle}
              description={videoDescription}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 px-4 border-t sticky bottom-0 bg-background/95 backdrop-blur z-20 py-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setStep((p) => (p > 1 ? p - 1 : p))}
            disabled={step === 1}
            className="gap-2 w-32"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Button>

          <Button
            size="lg"
            onClick={() => setStep((p) => (p < 7 ? p + 1 : p))}
            disabled={step === 7} // Or maybe hide on last step?
            className="gap-2 w-32"
          >
            {step === 7 ? "Finish" : "Next"}{" "}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Page;
