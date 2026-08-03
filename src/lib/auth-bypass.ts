export const BYPASS_MODE = true

export const DEV_MOCK_USER = {
  id: '1379b4a2-f81b-4f16-afd4-957b6af7412c',
  email: 'flakoro10@gmail.com',
}

export async function getEffectiveUser(supabase: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user
  } catch (e) {
    // ignore error
  }
  if (BYPASS_MODE) return DEV_MOCK_USER
  return null
}
