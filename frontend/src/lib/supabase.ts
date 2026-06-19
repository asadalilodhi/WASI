import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jeettuybmkqsxoyjwvxo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplZXR0dXlibWtxc3hveWp3dnhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MDY4MTIsImV4cCI6MjA5NzM4MjgxMn0.tUK8f2y54hC4tJoQnGWXrNpRH_4ZpMvAe7D0tPrX0sM';

export const supabase = createClient(supabaseUrl, supabaseKey);
