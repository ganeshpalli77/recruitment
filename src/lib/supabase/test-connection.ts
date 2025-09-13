// Test file to verify Supabase connection once credentials are set
import { createClient } from './server'

export async function testSupabaseConnection() {
  try {
    const supabase = await createClient()
    
    // Test basic connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('📊 Available tables:', data?.map(t => t.table_name))
    
    return { success: true, tables: data }
  } catch (err) {
    console.error('❌ Connection test failed:', err)
    return { success: false, error: 'Failed to connect' }
  }
}
