-- Update cleanup function to delete messages older than 1 day instead of 3 months
CREATE OR REPLACE FUNCTION public.cleanup_old_chat_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete messages older than 1 day (24 hours)
  DELETE FROM public.chat_messages 
  WHERE created_at < NOW() - INTERVAL '1 day';
  
  RAISE NOTICE 'Cleaned chat messages older than 1 day';
  RETURN;
END;
$$;