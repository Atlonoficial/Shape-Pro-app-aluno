-- Adicionar dados básicos ao professor para teste do TeacherCard
UPDATE profiles 
SET 
  bio = 'Professor especializado em educação física e wellness. Comprometido em ajudar alunos a alcançarem seus objetivos de saúde e fitness.',
  instagram_url = 'https://instagram.com/atlontech',
  facebook_url = 'https://facebook.com/atlontech',
  whatsapp_number = '5511999999999',
  specialties = ARRAY['Musculação', 'Fitness', 'Wellness']
WHERE 
  id = '0d5398c2-278e-4853-b980-f36961795e52' 
  AND user_type = 'teacher';