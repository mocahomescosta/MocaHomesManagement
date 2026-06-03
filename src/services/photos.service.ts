import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export const uploadCleaningPhoto = async (
  cleaningId: string,
  area: string,
  uri: string
): Promise<string> => {
  const timestamp = Date.now();
  const filename = `${area.replace(/\s+/g, '_')}_${timestamp}.jpg`;
  const storagePath = `cleanings/${cleaningId}/${filename}`;

  // Fetch the image and convert to blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};
