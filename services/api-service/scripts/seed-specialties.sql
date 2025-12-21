-- Seed Initial Specialties
-- This script adds common medical specialties to the database

INSERT INTO public.specialties (id, name, description, "isActive", "createdAt", "updatedAt")
SELECT 
    'c' || substr(md5(random()::text || clock_timestamp()::text), 1, 25) as id,
    name,
    description,
    true as "isActive",
    NOW() as "createdAt",
    NOW() as "updatedAt"
FROM (VALUES
    ('Cardiology', 'Heart and cardiovascular system diseases'),
    ('Dermatology', 'Skin, hair, and nail conditions'),
    ('Endocrinology', 'Hormone-related disorders'),
    ('Gastroenterology', 'Digestive system diseases'),
    ('General Practice', 'General medical care'),
    ('Neurology', 'Nervous system disorders'),
    ('Oncology', 'Cancer treatment and care'),
    ('Orthopedics', 'Bones, joints, and muscles'),
    ('Pediatrics', 'Medical care for children'),
    ('Psychiatry', 'Mental health and behavioral disorders'),
    ('Pulmonology', 'Lung and respiratory system diseases'),
    ('Urology', 'Urinary tract and male reproductive system')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public.specialties WHERE LOWER(name) = LOWER(v.name)
)
ON CONFLICT (name) DO NOTHING;

-- Verify inserted specialties
SELECT COUNT(*) as total_specialties FROM public.specialties;
SELECT name, description FROM public.specialties ORDER BY name;

