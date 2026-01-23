"use server";

import { createClient } from "@/utils/supabase/server";
import prisma from "@/utils/prisma";
import { generateSpeech } from "../fish-audio";
import { revalidatePath } from "next/cache";
import { join } from "path";
import { writeFile, readFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import ffmpeg from "fluent-ffmpeg";

// Helper to chunk text
// 150 words is approximately 1 minute of speech
function chunkText(text: string, maxWords: number = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let currentChunk: string[] = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWords) {
      chunks.push(currentChunk.join(" "));
      currentChunk = [];
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
}

// Internal function to process the task
async function processTask(taskId: string) {
  try {
    const task = await prisma.tTSTask.findUnique({
      where: { id: taskId },
    });

    if (!task) return;

    await prisma.tTSTask.update({
      where: { id: taskId },
      data: { status: "PROCESSING" },
    });

    const chunks = chunkText(task.prompt);
    const audioFiles: string[] = [];

    // Process each chunk
    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      // generateSpeech returns { filePath, publicUrl, ... }
      const result = await generateSpeech({
        voiceId: task.voiceId,
        content: chunk,
      });
      audioFiles.push(result.filePath);
    }

    if (audioFiles.length === 0) {
      throw new Error("No audio generated");
    }

    let finalAudioPath = audioFiles[0];

    // If multiple files, merge them
    if (audioFiles.length > 1) {
      const mergedFileName = `merged-${Date.now()}-${taskId}.mp3`;
      const publicAudioDir = join(process.cwd(), "public", "temp_audio");

      if (!existsSync(publicAudioDir)) {
        mkdirSync(publicAudioDir, { recursive: true });
      }

      const mergedFilePath = join(publicAudioDir, mergedFileName);

      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg();

        audioFiles.forEach((file) => {
          command.input(file);
        });

        command
          .on("error", (err) => {
            console.error("An error occurred merging audio: " + err.message);
            reject(err);
          })
          .on("end", () => {
            console.log("Merging finished!");
            resolve();
          })
          .mergeToFile(mergedFilePath, publicAudioDir); // 2nd arg is temp dir
      });

      finalAudioPath = mergedFilePath;
    }

    // Since generateSpeech saves to public/temp_audio, we can just use the filename to construct the URL
    // We assume the file is served from /temp_audio/filename
    const filename = finalAudioPath.split("/").pop();
    const publicUrl = `/temp_audio/${filename}`;

    await prisma.tTSTask.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        audioUrl: publicUrl,
      },
    });
  } catch (error) {
    console.error("Task processing failed:", error);
    await prisma.tTSTask.update({
      where: { id: taskId },
      data: { status: "FAILED" },
    });
  }
}

export async function createTTSTask(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    // For demo purposes, if no user, we might want to check DB for a fallback or just error
    // Assuming a valid user exists for the email or creating one on the fly is tricky without more context.
    // Let's assume user is logged in.
    throw new Error("Unauthorized");
  }

  // Ensure user exists in Prisma (sync with Supabase)
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    // Create user if not exists (simple sync)
    dbUser = await prisma.user.create({
      data: {
        email: user.email,
        id: user.id, // Best to sync IDs if possible, but schema has @default(uuid()) so it might conflict if we force it.
        // The schema says `id String @id @default(uuid())`.
        // Ideally we use Supabase ID. Let's try to match email.
      },
    });
  }

  const prompt = formData.get("prompt") as string;
  const voiceId = formData.get("voiceId") as string;

  if (!prompt || !voiceId) {
    throw new Error("Missing prompt or voiceId");
  }

  const task = await prisma.tTSTask.create({
    data: {
      userId: dbUser.id,
      prompt,
      voiceId,
      status: "PENDING",
    },
  });

  // Trigger processing without awaiting (fire and forget)
  // Note: Vercel/Serverless might kill this if not awaited.
  // For safety in this demo, we can await it if the generation is fast, or accept the risk.
  // Given user asked for "background", proper background jobs are needed.
  // As a compromise, we don't await, but in a real app use Inngest/BullMQ.
  processTask(task.id).catch((err) =>
    console.error("Background process error", err),
  );

  revalidatePath("/app/tts");
  return { success: true, taskId: task.id };
}

export async function getTTSTasks() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return [];

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) return [];

  return await prisma.tTSTask.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSavedVoices() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return [];

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) return [];

  return await prisma.savedVoice.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function saveVoice(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) throw new Error("User not found");

  const name = formData.get("name") as string;
  const voiceId = formData.get("voiceId") as string;

  if (!name || !voiceId) throw new Error("Missing name or voiceId");

  try {
    await prisma.savedVoice.create({
      data: {
        userId: dbUser.id,
        name,
        voiceId,
      },
    });
    revalidatePath("/app/tts");
    return { success: true };
  } catch (error) {
    console.error("Error saving voice:", error);
    return {
      success: false,
      error: "Failed to save voice or voice already exists",
    };
  }
}

export async function deleteVoice(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  await prisma.savedVoice.delete({
    where: { id },
  });

  revalidatePath("/app/tts");
  return { success: true };
}
