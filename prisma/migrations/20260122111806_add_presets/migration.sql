-- CreateTable
CREATE TABLE "Preset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InspirationLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "thumbnail" TEXT,
    "presetId" TEXT NOT NULL,

    CONSTRAINT "InspirationLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Preset" ADD CONSTRAINT "Preset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InspirationLink" ADD CONSTRAINT "InspirationLink_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
