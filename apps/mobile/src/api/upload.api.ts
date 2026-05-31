import { apiClient } from './client';
import { unwrapApiResponse } from '../lib/api-response';

export interface ProgressPhotoMetadata {
  weight?: number;
  note?: string;
}

export interface ProgressPhotoUploadResult {
  id: string;
  imageUrl: string;
}

export async function uploadProgressPhoto(
  imageUri: string,
  metadata: ProgressPhotoMetadata = {},
): Promise<ProgressPhotoUploadResult> {
  const form = new FormData();

  // React Native / Expo FormData accepts an object with uri, name, and type.
  form.append('photo', {
    uri: imageUri,
    name: imageUri.split('/').pop() ?? 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  if (metadata.weight !== undefined) {
    form.append('weight', String(metadata.weight));
  }

  if (metadata.note !== undefined) {
    form.append('note', metadata.note);
  }

  const res = await apiClient.post('/uploads/progress-photo', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  // Backend returns { success, message, data: { id, imageUrl } }
  return unwrapApiResponse<ProgressPhotoUploadResult>(res);
}
