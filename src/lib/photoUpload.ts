import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

/** Upload a single file to Firebase Storage and return its download URL. */
export async function uploadPhoto(
  file: File,
  storagePath: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const photoRef = ref(storage, storagePath);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(photoRef, file);
    task.on(
      'state_changed',
      (snap) => onProgress?.(snap.bytesTransferred / snap.totalBytes),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    );
  });
}

/**
 * Delete photos from Firebase Storage by their download URLs.
 * Errors (e.g. already deleted) are silently swallowed.
 */
export async function deletePhotos(urls: string[]): Promise<void> {
  if (!urls.length) return;
  await Promise.allSettled(
    urls.map(async (url) => {
      // Extract the storage path from the Firebase download URL:
      // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
      const match = url.match(/\/o\/(.+?)(?:\?|$)/);
      if (!match) return;
      const path = decodeURIComponent(match[1]);
      await deleteObject(ref(storage, path));
    }),
  );
}
