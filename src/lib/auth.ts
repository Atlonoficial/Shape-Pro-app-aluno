import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { initializeUserData } from './firebase-setup';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  userType: 'student' | 'teacher';
  createdAt: Date;
  lastLogin: Date;
  profileComplete: boolean;
}

// Sign up new user
export const signUpUser = async (email: string, password: string, name: string, userType: 'student' | 'teacher' = 'student') => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      name,
      userType,
      createdAt: new Date(),
      lastLogin: new Date(),
      profileComplete: false
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    // Inicializar dados completos do usuário
    await initializeUserData({
      uid: user.uid,
      email: user.email || '',
      name,
      userType
    });
    
    return user;
  } catch (error) {
    console.error('Error signing up user:', error);
    throw error;
  }
};

// Sign in user
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Update last login
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: new Date()
    }, { merge: true });

    return userCredential.user;
  } catch (error) {
    console.error('Error signing in user:', error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get user profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Update user profile photo
export const updateUserProfile = async (uid: string, updates: { photoURL?: string; displayName?: string }) => {
  try {
    const user = auth.currentUser;
    if (user && user.uid === uid) {
      await updateProfile(user, updates);
    }
    
    // Also update in Firestore
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};