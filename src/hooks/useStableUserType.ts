import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export interface UserTypeData {
  isStudent: boolean
  isTeacher: boolean
  teacherId: string | null
  loading: boolean
  userType: 'student' | 'teacher' | 'unknown'
  refresh: () => Promise<void>
}

export function useStableUserType(): UserTypeData {
  const { user } = useAuth()
  const [isStudent, setIsStudent] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherId, setTeacherId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState<'student' | 'teacher' | 'unknown'>('unknown')

  const fetchUserType = useCallback(async () => {
    if (!user) {
      console.log('[useStableUserType] ⚠️ No user found')
      setLoading(false)
      return
    }

    console.log('[useStableUserType] 🔍 Checking user type for:', user.id)

    try {
      // Check if student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('teacher_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (studentError) {
        console.error('[useStableUserType] ❌ Student check error:', studentError)
      }

      if (studentData) {
        console.log('[useStableUserType] ✅ User IS a student:', studentData)
        setIsStudent(true)
        setTeacherId(studentData.teacher_id)
        setUserType('student')
        setLoading(false)
        return
      }

      // Check if teacher (has students)
      const { count, error: teacherError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_id', user.id)

      if (teacherError) {
        console.error('[useStableUserType] ❌ Teacher check error:', teacherError)
      }

      if (count && count > 0) {
        console.log('[useStableUserType] ✅ User IS a teacher with', count, 'students')
        setIsTeacher(true)
        setUserType('teacher')
      } else {
        console.log('[useStableUserType] ⚠️ User is neither student nor teacher')
      }
    } catch (error) {
      console.error('[useStableUserType] ❌ Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchUserType()
  }, [fetchUserType])

  return {
    isStudent,
    isTeacher,
    teacherId,
    loading,
    userType,
    refresh: fetchUserType
  }
}
