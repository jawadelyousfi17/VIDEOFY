"use server";

export type TranscriptSegment = {
  text: string;
  start: number;
  duration: number;
};

export type YouTubeTranscriptResponse = {
  video_id: string;
  language: string;
  transcript: TranscriptSegment[];
};

export async function getYouTubeTranscript(videoUrl: string): Promise<string> {
  const apiKey = process.env.TRANSCRIPT_API_KEY;

  if (!apiKey) {
    throw new Error(
      "TRANSCRIPT_API_KEY is not defined in environment variables.",
    );
  }

  try {
    const response = await fetch(
      `https://transcriptapi.com/api/v2/youtube/transcript?video_url=${encodeURIComponent(
        videoUrl,
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to fetch transcript: ${response.statusText}`,
      );
    }

    const data: YouTubeTranscriptResponse = await response.json();

    // Concatenate all transcript segments into a single string
    const fullTranscript = data.transcript
      .map((segment) => segment.text)
      .join(". ");

    return fullTranscript;
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);
    throw error;
  }
}
