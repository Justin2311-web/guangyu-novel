// TEMPORARY debug route for diagnosing the "未找到作者资料" issue.
// Shows ONLY the current logged-in user's own data + the Supabase project ref
// (no secrets / no keys). Remove after diagnosis.
import { createSupabaseServerClient, getCurrentUser } from '@/lib/supabase/server';
import { getMyAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'author debug' };

function projectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url.replace(/^https?:\/\//, '').split('.')[0] || '(unset)';
}

export default async function AuthorDebugPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap' }}>
        {JSON.stringify({ supabaseProject: projectRef(), loggedIn: false }, null, 2)}
      </pre>
    );
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, role, display_name, suspended, deleted_at')
    .eq('id', user.id)
    .maybeSingle();

  const { data: authorRows, error: authorErr } = await supabase
    .from('authors')
    .select('id, profile_id, pen_name, status')
    .eq('profile_id', user.id);

  const myAuthor = await getMyAuthor();

  const dump = {
    supabaseProject: projectRef(),
    authUid: user.id,
    authEmail: user.email,
    profile: profile ?? null,
    profileError: profileErr?.message ?? null,
    authorRowsForThisUid: authorRows ?? null,
    authorRowsCount: authorRows?.length ?? 0,
    authorError: authorErr?.message ?? null,
    getMyAuthorResult: myAuthor,
  };

  return <pre style={{ whiteSpace: 'pre-wrap', padding: 16 }}>{JSON.stringify(dump, null, 2)}</pre>;
}
