"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

type GenerateSpeechInput = {
  voiceId: string;
  content: string;
};

export async function generateSpeech(input: GenerateSpeechInput) {
  const apiKey = process.env.FISH_AUDIO_API_KEY;

  if (!apiKey) {
    throw new Error(
      "FISH_AUDIO_API_KEY is not defined in environment variables.",
    );
  }

  try {
    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference_id: input.voiceId,
        text: input.content,
        format: "mp3",
        latency: "normal",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to generate speech: ${response.statusText}`,
      );
    }

    // The API returns audio as binary data
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    // Save locally to public/temp_audio for playback and processing
    const fileName = `audio-${Date.now()}.mp3`;
    const publicDir = join(process.cwd(), "public", "temp_audio");

    if (!existsSync(publicDir)) {
      await mkdir(publicDir, { recursive: true });
    }

    const filePath = join(publicDir, fileName);
    await writeFile(filePath, buffer);

    const publicUrl = `/temp_audio/${fileName}`;

    return {
      filePath, // Server-side path for ffmpeg
      publicUrl, // Client-side URL for playback
      format: "mp3",
      size: audioBuffer.byteLength,
    };
  } catch (error) {
    console.error("Error generating speech with Fish Audio:", error);
    throw error;
  }
}

// Deprecated: No longer needed as generateSpeech saves the file directly
export async function saveAudio(audioBase64: string): Promise<string> {
  return "";
}
