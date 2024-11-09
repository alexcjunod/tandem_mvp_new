import { supabase } from '@/lib/supabase/client'
import type { Community, Post, Comment } from '@/types/community'

export async function fetchCommunities() {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchCommunityPosts(communityId: number) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(full_name, avatar_url),
      comments:comments(count),
      likes:post_likes(count)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function joinCommunity(communityId: number, userId: string) {
  const { error } = await supabase
    .from('community_members')
    .insert({ community_id: communityId, user_id: userId })

  if (error) throw error
}

export async function leaveCommunity(communityId: number, userId: string) {
  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function createPost(data: {
  content: string
  communityId: number
  userId: string
  imageUrl?: string
}) {
  const { error } = await supabase
    .from('posts')
    .insert({
      content: data.content,
      community_id: data.communityId,
      user_id: data.userId,
      image_url: data.imageUrl
    })

  if (error) throw error
}

export async function likePost(postId: number, userId: string) {
  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })

  if (error) throw error
}

export async function addComment(data: {
  content: string
  postId: number
  userId: string
}) {
  const { error } = await supabase
    .from('comments')
    .insert({
      content: data.content,
      post_id: data.postId,
      user_id: data.userId
    })

  if (error) throw error
} 