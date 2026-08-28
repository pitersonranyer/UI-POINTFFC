import {createUserWithEmailAndPassword,GoogleAuthProvider,reload,sendEmailVerification,sendPasswordResetEmail,signInWithEmailAndPassword,signInWithPopup,signOut,updateProfile,User} from "firebase/auth";
import { auth } from "@/lib/firebase";
import type { AuthenticatedUser, AuthResponse } from "@/types/auth";
import { apiFetch } from "./apiClient";
const TOKEN_KEY="fantasy.accessToken", USER_KEY="fantasy.user", EXPIRES_KEY="fantasy.expiresIn";
function store(session:AuthResponse){sessionStorage.setItem(TOKEN_KEY,session.accessToken);sessionStorage.setItem(USER_KEY,JSON.stringify(session.user));sessionStorage.setItem(EXPIRES_KEY,session.expiresIn);return session.user}
async function createFantasySession(firebaseUser:User){const idToken=await firebaseUser.getIdToken(true);return store(await apiFetch<AuthResponse>("/auth/firebase/session",{method:"POST",body:JSON.stringify({idToken})}))}
async function sendVerificationEmail(firebaseUser:User):Promise<void>{
  await sendEmailVerification(firebaseUser);
}
export const authService = {
  createFantasySession,
  async login(email:string,senha:string){const credential=await signInWithEmailAndPassword(auth,email,senha);if(!credential.user.emailVerified){this.clearSession();return null}return createFantasySession(credential.user)},
  async register(nome:string,email:string,senha:string){const credential=await createUserWithEmailAndPassword(auth,email,senha);await sendVerificationEmail(credential.user);await updateProfile(credential.user,{displayName:nome});this.clearSession();return credential.user},
  async loginWithGoogle(){const result=await signInWithPopup(auth,new GoogleAuthProvider());return createFantasySession(result.user)},
  forgotPassword:(email:string)=>sendPasswordResetEmail(auth,email),
  resendVerification:async()=>{if(!auth.currentUser)throw new Error("Usuário Firebase ausente");await sendVerificationEmail(auth.currentUser)},
  async checkEmailVerification(){if(!auth.currentUser)return false;await reload(auth.currentUser);if(!auth.currentUser.emailVerified)return false;await createFantasySession(auth.currentUser);return true},
  getCurrentUser:()=>apiFetch<AuthenticatedUser>("/users/me",{authenticated:true}),
  getToken:()=>typeof window==="undefined"?null:sessionStorage.getItem(TOKEN_KEY),
  getStoredUser:()=>{if(typeof window==="undefined")return null;try{return JSON.parse(sessionStorage.getItem(USER_KEY)||"null") as AuthenticatedUser|null}catch{return null}},
  clearSession(){sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(USER_KEY);sessionStorage.removeItem(EXPIRES_KEY)},
  async logout(){this.clearSession();if(auth.currentUser)await signOut(auth)},
};
