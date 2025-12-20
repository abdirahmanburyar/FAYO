-- Ads Service Database Schema
-- This file creates the complete database schema for the ads-service
-- Run with: cat ads-service.sql | docker exec -i postgres psql -U postgres

-- Create ads schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS ads;

-- Create AdStatus enum
DO $$ BEGIN
    CREATE TYPE ads."AdStatus" AS ENUM ('INACTIVE', 'PENDING', 'ACTIVE', 'EXPIRED', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AdType enum
DO $$ BEGIN
    CREATE TYPE ads."AdType" AS ENUM ('BANNER', 'CAROUSEL', 'INTERSTITIAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ads table
CREATE TABLE IF NOT EXISTS ads.ads (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    company TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    type ads."AdType" NOT NULL DEFAULT 'BANNER',
    status ads."AdStatus" NOT NULL DEFAULT 'PENDING',
    price DECIMAL NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ads_status_dates ON ads.ads(status, "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_ads_priority_status ON ads.ads(priority DESC, status);

-- Add comments for documentation
COMMENT ON SCHEMA ads IS 'Schema for advertisements management';
COMMENT ON TABLE ads.ads IS 'Stores advertisement information';
COMMENT ON COLUMN ads.ads.priority IS 'Higher priority ads are shown first';
COMMENT ON COLUMN ads.ads."clickCount" IS 'Number of times the ad was clicked';
COMMENT ON COLUMN ads.ads."viewCount" IS 'Number of times the ad was viewed';
COMMENT ON COLUMN ads.ads.price IS 'Price per day in dollars';

