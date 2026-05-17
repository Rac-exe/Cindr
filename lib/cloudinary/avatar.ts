const DEFAULT_AVATAR_SIZE = 256;

export function getCloudinaryCloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
}

export function buildCloudinaryAvatarUrl(
  publicId: string,
  size = DEFAULT_AVATAR_SIZE
): string {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName || !publicId) return "";

  const encodedPublicId = publicId
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_face,w_${size},h_${size},q_auto,f_auto/${encodedPublicId}`;
}
