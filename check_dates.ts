import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as dotenv from 'https://deno.land/std/dotenv/mod.ts'

const env = await dotenv.load({ envPath: './.env' });
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Error: Missing Supabase credentials in .env");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDates() {
  const { data: ayets, error: ayetErr } = await supabase
    .from('daily_content')
    .select('date')
    .eq('type', 'ayet')
    .order('date', { ascending: false })
    .limit(1);

  const { data: hadiths, error: hadithErr } = await supabase
    .from('daily_content')
    .select('date')
    .eq('type', 'hadis')
    .order('date', { ascending: false })
    .limit(1);
  
  const { count: totalAyets } = await supabase.from('daily_content').select('*', { count: 'exact', head: true }).eq('type', 'ayet');
  const { count: totalHadiths } = await supabase.from('daily_content').select('*', { count: 'exact', head: true }).eq('type', 'hadis');

  console.log('--- SUPABASE DATABASE CHECK ---');
  if (ayetErr || hadithErr) {
    console.error("Query Error:", ayetErr || hadithErr);
  } else {
    console.log(`Total Ayets in DB: ${totalAyets}`);
    console.log(`Latest Ayet Date: ${ayets && ayets.length > 0 ? ayets[0].date : 'None'}`);
    console.log(`Total Hadiths in DB: ${totalHadiths}`);
    console.log(`Latest Hadith Date: ${hadiths && hadiths.length > 0 ? hadiths[0].date : 'None'}`);
  }
}

checkDates();
