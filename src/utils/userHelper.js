'use strict'

const cleanEmail = (email = '') => String(email).trim().toLowerCase()

const toPublicUser = (userInstanceOrPlain) => {
  if (!userInstanceOrPlain) return null
  const plain = typeof userInstanceOrPlain.toJSON === 'function' ? userInstanceOrPlain.toJSON() : userInstanceOrPlain
  const { password_hash, salt, ...safe } = plain
  return {
    id: safe.id,
    name: safe.name,
    email: safe.email,
    role: safe.role,
    title: safe.title,
    status: safe.status,
    avatar: safe.avatar_url || safe.avatar,
    emailVerifiedAt: safe.email_verified_at,
    profile: {
      phone: safe.profile?.phone || '',
      city: safe.profile?.city || '',
      bio: safe.profile?.bio || '',
      expertise: safe.profile?.expertise || '',
      education: safe.profile?.education || '',
      addressLine1: safe.profile?.address_line1 || '',
      addressLine2: safe.profile?.address_line2 || '',
      state: safe.profile?.state || '',
      country: safe.profile?.country || '',
      pincode: safe.profile?.pincode || '',
      metadata: safe.profile?.metadata || {},
    },
    createdAt: safe.created_at,
    updatedAt: safe.updated_at,
  }
}

module.exports = {
  cleanEmail,
  toPublicUser,
}
