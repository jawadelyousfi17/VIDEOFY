"use server";

import Anthropic from "@anthropic-ai/sdk";

type GenerateScriptInput = {
  idea: string;
  inspirationScripts: Array<{ title: string; script: string }>;
  lengthInMinutes: number;
  tone?: string;
  complexity?: number;
};

export async function generateScript(input: GenerateScriptInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not defined in environment variables.",
    );
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  // Build inspiration context
  const inspirationContext =
    input.inspirationScripts.length > 0
      ? `\n\nHere are some reference video transcripts for inspiration on style and structure:\n\n${input.inspirationScripts
          .map(
            (ref, idx) =>
              `Reference Video ${idx + 1}: "${ref.title}"\n${ref.script.substring(0, 2000)}...`,
          )
          .join("\n\n")}`
      : "";

  const prompt = `You are a professional video script writer. Create a compelling video script based on the following requirements:

**Video Idea:** ${input.idea}

**Target Duration:** ${input.lengthInMinutes} minute(s) of reading time (approximately ${input.lengthInMinutes * 150} words)

**Tone:** ${input.tone || "Casual"}

**Complexity Level:** ${input.complexity || 5}/10
${inspirationContext}

CRITICAL REQUIREMENT: Output ONLY raw text that will be read aloud by a Text-to-Speech system. 
- NO markdown formatting (no bold, italics, headers)
- NO section labels or titles
- NO stage directions or speaker notes
- NO brackets or parentheticals
- ONLY the exact words that should be spoken out loud

Write a complete, engaging video script that:
1. Has a strong hook in the first 5 seconds
2. Maintains viewer engagement throughout
3. Has natural, conversational language
4. Ends with a clear call-to-action
5. Matches the specified tone and complexity level
6. Takes inspiration from the reference videos (if provided) for style and pacing

Output the script as continuous spoken text with natural pauses indicated by punctuation only.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const scriptContent = message.content[0];

    if (scriptContent.type === "text") {
      return {
        script: scriptContent.text,
        usage: message.usage,
      };
    }

    throw new Error("Unexpected response format from Claude API");
  } catch (error) {
    console.error("Error generating script with Claude:", error);
    throw error;
  }
}

export async function generateTitleAndDescription(script: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not defined in environment variables.",
    );
  }

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.7,
      system:
        "You are an expert YouTube content creator. Your task is to generate a catchy, SEO-optimized title and a detailed description for a video based on the provided script. The output should be JSON formatted with 'title' and 'description' keys. IMPORTANT: The output must be valid JSON. Escape all newlines within value strings as \\n.",
      messages: [
        {
          role: "user",
          content: `Please generate a YouTube title and description for this video script:\n\n${script}\n\nReturn ONLY valid JSON.`,
        },
      ],
    });

    const content = message.content[0];

    if (content.type === "text") {
      let text = content.text;

      // Clean up markdown code blocks if present
      text = text.replace(/```json\n?|```/g, "");

      // Locate the JSON object
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");

      if (start !== -1 && end !== -1) {
        text = text.substring(start, end + 1);
      }

      try {
        const json = JSON.parse(text);
        return {
          title: json.title,
          description: json.description,
          usage: message.usage,
        };
      } catch (e) {
        // Fallback: If parsing fails (often due to unescaped newlines in the description), 
        // attempt robust regex extraction that supports multi-line strings.
        const titleMatch = text.match(/"title"\s*:\s*"([\s\S]*?)"\s*,/);
        const descMatch = text.match(/"description"\s*:\s*"([\s\S]*?)"\s*}/);

        if (titleMatch && descMatch) {
          return {
            title: titleMatch[1],
            description: descMatch[1],
            usage: message.usage,
          };
        }

        throw new Error(
          "Failed to parse JSON from Claude response: " + content.text,
        );
      }
    }

    throw new Error("Unexpected response format from Claude API");
  } catch (error) {
    console.error("Error generating metadata with Claude:", error);
    throw error;
  }
}
