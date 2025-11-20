-- Add UPDATE policy for teachers on reward_redemptions
CREATE POLICY "Teachers can update redemptions for their rewards"
ON reward_redemptions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM rewards_items ri
    WHERE ri.id = reward_redemptions.reward_id
    AND ri.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM rewards_items ri
    WHERE ri.id = reward_redemptions.reward_id
    AND ri.created_by = auth.uid()
  )
);

-- Add function to refund points when redemption is rejected
CREATE OR REPLACE FUNCTION public.refund_redemption_points(
  _redemption_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_redemption record;
  v_result json;
BEGIN
  -- Get redemption details
  SELECT * INTO v_redemption
  FROM reward_redemptions
  WHERE id = _redemption_id
  AND status = 'rejected';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Redemption not found or not rejected'
    );
  END IF;

  -- Refund points to user
  UPDATE user_points
  SET total_points = total_points + v_redemption.points_spent,
      updated_at = now()
  WHERE user_id = v_redemption.user_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'points_refunded', v_redemption.points_spent
  );
END;
$$;