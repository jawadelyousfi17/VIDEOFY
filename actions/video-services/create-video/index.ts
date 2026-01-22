"use server";

import { spawn } from "child_process";
import { writeFile, unlink, mkdir, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { promisify } from "util";

type CreateVideoInput = {
  demoVideoUrl: string; // URL or path to demo video
  audioFilePath: string; // Path to audio file on disk
  audioDuration: number; // Duration in seconds
  outputFilename?: string;
};

export async function createVideo(input: CreateVideoInput) {
  const {
    demoVideoUrl,
    audioFilePath,
    audioDuration,
    outputFilename = `video-${Date.now()}.mp4`,
  } = input;

  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), "temp");
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  const outputPath = path.join(tempDir, outputFilename);

  try {
    console.log("createVideo input:", JSON.stringify(input, null, 2));

    // Resolve the demo video path relative to project root
    const resolvedVideoPath = path.join(process.cwd(), demoVideoUrl);

    console.log(`Resolved video path: ${resolvedVideoPath}`);
    console.log(`Audio path: ${audioFilePath}`);

    // Validate inputs
    if (!resolvedVideoPath) throw new Error("Resolved video path is undefined");
    if (!audioFilePath) throw new Error("Audio file path is undefined");

    // Check if files exist and log their stats
    if (existsSync(resolvedVideoPath)) {
      const stats = await import("fs/promises").then((fs) =>
        fs.stat(resolvedVideoPath),
      );
      console.log(
        `Video file stats: size=${stats.size}, created=${stats.birthtime}`,
      );
    } else {
      throw new Error(`Demo video not found at: ${resolvedVideoPath}`);
    }

    if (existsSync(audioFilePath)) {
      const stats = await import("fs/promises").then((fs) =>
        fs.stat(audioFilePath),
      );
      console.log(
        `Audio file stats: size=${stats.size}, created=${stats.birthtime}`,
      );
    } else {
      throw new Error(`Audio file not found at: ${audioFilePath}`);
    }

    // Get demo video duration
    const videoDuration = await getVideoDuration(resolvedVideoPath);

    if (!videoDuration || videoDuration <= 0) {
      throw new Error(`Invalid video duration: ${videoDuration}`);
    }

    if (!audioDuration || audioDuration <= 0) {
      throw new Error(`Invalid audio duration: ${audioDuration}`);
    }

    // Calculate how many times to loop the video
    const loopCount = Math.ceil(audioDuration / videoDuration);

    if (!isFinite(loopCount)) {
      throw new Error(
        `Invalid loop count calculation: ${audioDuration} / ${videoDuration}`,
      );
    }

    console.log(`Audio duration: ${audioDuration}s`);
    console.log(`Video duration: ${videoDuration}s`);
    console.log(`Looping video ${loopCount} times`);

    // Create the final video
    await new Promise<void>((resolve, reject) => {
      console.log("Starting FFmpeg process via spawn...");

      const args = [
        "-stream_loop",
        "-1", // Loop infinitely
        "-i",
        resolvedVideoPath,
        "-i",
        audioFilePath,
        "-map",
        "0:v:0", // Video from first input
        "-map",
        "1:a:0", // Audio from second input
        "-c:v",
        "libx264",
        "-c:a",
        "aac",
        "-shortest", // Stop when shortest stream (audio) ends
        "-pix_fmt",
        "yuv420p",
        "-y", // Overwrite output
        outputPath,
      ];

      console.log("FFmpeg command: ffmpeg", args.join(" "));

      const ffmpegProcess = spawn("ffmpeg", args);

      ffmpegProcess.stdout.on("data", (data) => {
        console.log(`FFmpeg stdout: ${data}`);
      });

      ffmpegProcess.stderr.on("data", (data) => {
        // FFmpeg logs to stderr by default
        console.log(`FFmpeg stderr: ${data}`);
      });

      ffmpegProcess.on("close", (code) => {
        if (code === 0) {
          console.log("Video processing completed successfully");
          resolve();
        } else {
          console.error(`FFmpeg process exited with code ${code}`);
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpegProcess.on("error", (err) => {
        console.error("Failed to spawn FFmpeg process:", err);
        reject(err);
      });
    });

    // Read the output video as base64
    const videoBuffer = await readFile(outputPath);
    const videoBase64 = videoBuffer.toString("base64");

    // We do not delete the file here so it can be used for upload
    // The caller or a cron job should handle cleanup of 'temp/' eventually
    // await unlink(outputPath).catch(console.error);

    return {
      video: videoBase64,
      filePath: outputPath,
      format: "mp4",
      size: videoBuffer.length,
      duration: audioDuration,
    };
  } catch (error) {
    // Clean up on error
    await unlink(outputPath).catch(() => {});
    console.error("Error creating video:", error);
    throw error;
  }
}

// Helper function to get video duration
function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const args = [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      videoPath,
    ];

    const ffprobeProcess = spawn("ffprobe", args);
    let output = "";

    ffprobeProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    ffprobeProcess.stderr.on("data", (data) => {
      console.error(`FFprobe stderr: ${data}`);
    });

    ffprobeProcess.on("close", (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (isNaN(duration)) {
          reject(new Error("Could not parse duration from ffprobe output"));
        } else {
          resolve(duration);
        }
      } else {
        reject(new Error(`FFprobe exited with code ${code}`));
      }
    });

    ffprobeProcess.on("error", (err) => {
      reject(err);
    });
  });
}
