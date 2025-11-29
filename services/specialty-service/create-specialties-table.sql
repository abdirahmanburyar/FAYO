-- Create specialties table
CREATE TABLE IF NOT EXISTS specialties (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialties_pkey" PRIMARY KEY (id)
);

-- Create unique index on name
CREATE UNIQUE INDEX IF NOT EXISTS "specialties_name_key" ON specialties(name);

