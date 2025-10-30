-- Add category column to medical_exams table
ALTER TABLE public.medical_exams 
ADD COLUMN category text NOT NULL DEFAULT 'others';

-- Add check constraint for valid categories
ALTER TABLE public.medical_exams 
ADD CONSTRAINT medical_exams_category_check 
CHECK (category IN ('blood', 'cardiology', 'imaging', 'others'));