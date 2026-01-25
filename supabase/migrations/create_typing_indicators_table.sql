-- Create typing indicators table for real-time typing status
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL,
  typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert/update their own typing status
CREATE POLICY "Users can manage their own typing status"
  ON public.typing_indicators
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view typing status of their contacts
CREATE POLICY "Users can view typing status of contacts"
  ON public.typing_indicators
  FOR SELECT
  USING (auth.uid() = contact_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Function to automatically clean up old typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove typing indicators older than 10 seconds
  DELETE FROM public.typing_indicators
  WHERE updated_at < (NOW() - INTERVAL '10 seconds');
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_typing_indicators_contact_id ON public.typing_indicators(contact_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_updated_at ON public.typing_indicators(updated_at);
