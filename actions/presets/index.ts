"use server";

import prisma from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";
import { YoutubeLink } from "@/app/app/create-video/page";

export async function savePreset(name: string, links: YoutubeLink[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    throw new Error("User not authenticated");
  }

  // Ensure user exists in Prisma
  let dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: user.email,
        id: user.id,
      },
    });
  }

  // Create Preset
  const preset = await prisma.preset.create({
    data: {
      name,
      userId: dbUser.id,
      links: {
        create: links.map((link) => ({
          url: link.url,
          title: link.title,
          thumbnail: link.thumbnail,
        })),
      },
    },
    include: {
      links: true,
    },
  });

  return preset;
}

export async function getPresets() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return [];
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    return [];
  }

  const presets = await prisma.preset.findMany({
    where: {
      userId: dbUser.id,
    },
    include: {
      links: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return presets;
}
