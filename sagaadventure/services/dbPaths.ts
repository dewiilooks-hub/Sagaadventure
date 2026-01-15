import firebase from 'firebase/compat/app';
import { db, appId } from './firebase';

/**
 * Returns a CollectionReference for Saga data.
 *
 * - If user is signed-in (and not anonymous): write under users/{uid}/apps/{appId}/{collection}
 * - Otherwise (anonymous or no user): fall back to the previous public artifacts path
 *
 * This keeps backward compatibility with the existing structure while enabling
 * per-user data separation once Firebase Auth is used.
 */
export function sagaCollection(
  collectionName: string,
  user?: firebase.User | null
): firebase.firestore.CollectionReference | null {
  if (!db) return null;

  if (user && !user.isAnonymous) {
    return db
      .collection('users')
      .doc(user.uid)
      .collection('apps')
      .doc(appId)
      .collection(collectionName);
  }

  return db
    .collection('artifacts')
    .doc(appId)
    .collection('public')
    .doc('data')
    .collection(collectionName);
}
