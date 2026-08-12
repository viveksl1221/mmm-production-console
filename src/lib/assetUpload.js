import { supabase } from './supabaseClient.js';
import { slug } from './derived.js';

// Uploads a creative asset (post image or Reel cover) to the public
// post-assets Storage bucket and returns its public URL. Path includes a
// timestamp so re-uploading a replacement never collides with — or
// silently overwrites — the previous file while a save is in flight.
export async function uploadPostAsset(client, num, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${slug(client)}/${num}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('post-assets').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('post-assets').getPublicUrl(path);
  return data.publicUrl;
}
