/*
  Warnings:

  - You are about to drop the column `gbp_data` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `scraped_website_data` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the `jobs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "jobs" DROP CONSTRAINT "jobs_project_id_fkey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "gbp_data",
DROP COLUMN "scraped_website_data",
ADD COLUMN     "selected_place_id" TEXT,
ADD COLUMN     "selected_website_url" TEXT,
ADD COLUMN     "step_gbp_scrape" JSONB,
ADD COLUMN     "step_image_analysis" JSONB,
ADD COLUMN     "step_website_scrape" JSONB;

-- DropTable
DROP TABLE "jobs";

-- DropEnum
DROP TYPE "JobStatus";

-- DropEnum
DROP TYPE "JobType";
