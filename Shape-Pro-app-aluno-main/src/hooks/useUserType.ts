import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export function useUserType() {
  const { user } = useAuth()
  const [isStudent, setIsStudent] = useState(false)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUserType() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data: studentData } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .single()

      if (studentData) {
        setIsStudent(true)
        setTeacherId(studentData.teacher_id)
      }

      setLoading(false)
    }

    checkUserType()
  }, [user])

  return { isStudent, teacherId, loading }
}