"use server";

import { google } from "googleapis";
import { createReadStream } from "fs";
import { stat } from "fs/promises";

type UploadVideoInput = {
  videoPath: string;
  title: string;
  description: string;
  tags?: string[];
  thumbnailPath?: string;
};

export async function uploadVideoToYouTube(input: UploadVideoInput) {
  const { videoPath, title, description, tags = [], thumbnailPath } = input;

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "YouTube credentials (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN) are missing from environment variables.",
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "https://developers.google.com/oauthplayground", // Redirect URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const calendar = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  try {
    const fileSize = (await stat(videoPath)).size;

    const res = await calendar.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: tags,
        },
        status: {
          privacyStatus: "private", // Default to private for safety
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(videoPath),
      },
    });

    const videoId = res.data.id;

    if (thumbnailPath && videoId) {
      try {
        await calendar.thumbnails.set({
          videoId: videoId,
          media: {
            body: createReadStream(thumbnailPath),
          },
        });
      } catch (thumbError) {
        console.error("Error uploading thumbnail:", thumbError);
        // Don't fail the whole process if just the thumbnail fails
      }
    }

    return {
      success: true,
      videoId: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (error) {
    console.error("Error uploading to YouTube:", error);
    throw error;
  }
}
