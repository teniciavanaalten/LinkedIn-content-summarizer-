import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Supabase environment variables are missing.' });
  }

  if (req.method === 'GET') {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // FETCH ALL POSTS GLOBALLY
      // We removed the .eq('user_id', ...) filter so every visitor sees the same library.
      const { data, error } = await supabase
        .from('marketing_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}