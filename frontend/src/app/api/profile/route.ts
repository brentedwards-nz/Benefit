import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: user, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: userError?.message || 'User not authenticated' }, { status: 401 });
  }

  const auth_id = user.user.id;

  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, birth_date")
    .eq("auth_id", auth_id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
