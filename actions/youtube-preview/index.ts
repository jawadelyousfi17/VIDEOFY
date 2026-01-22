"use server";

export async function getYoutubePreview(videoUrl: string) {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch YouTube preview");
    }

    const data = await response.json();

    return {
      title: data.title,
      thumbnail: data.thumbnail_url,
      authorName: data.author_name,
    };
  } catch (error) {
    console.error("Error fetching YouTube preview:", error);
    return null;
  }
}
