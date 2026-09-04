"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {onAuthStateChanged,User} from "firebase/auth";
import {auth} from "@/lib/firebase";
import { authService } from "@/services/authService";
import {setSessionRefresher} from "@/services/apiClient";
import type { AuthenticatedUser } from "@/types/auth";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  firebaseUser: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<boolean>;
  register(nome:string,email:string,senha:string):Promise<void>;
  loginWithGoogle():Promise<void>;
  resendVerification():Promise<void>;
  checkEmailVerification():Promise<boolean>;
  forgotPassword(email:string):Promise<void>;
  logout(): Promise<void>;
  getToken(): string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [firebaseUser,setFirebaseUser]=useState<User|null>(null);
  const [accessToken,setAccessToken]=useState<string|null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const clearInvalid=useCallback(async(status?:number)=>{await authService.logout();setFirebaseUser(null);setUser(null);setAccessToken(null);if(status===403)sessionStorage.setItem("fantasy.authMessage","Sua conta não está disponível para acesso.")},[]);

  const rebuild=useCallback(async(firebaseIdentity:User)=>{if(!firebaseIdentity.emailVerified){authService.clearSession();setUser(null);setAccessToken(null);return null}const restored=await authService.createFantasySession(firebaseIdentity);setUser(restored);const token=authService.getToken();setAccessToken(token);return token},[]);
  useEffect(()=>{setSessionRefresher(async()=>{const current=auth.currentUser;if(!current?.emailVerified)return null;try{return await rebuild(current)}catch{return null}});const unsubscribe=onAuthStateChanged(auth,async(identity)=>{setFirebaseUser(identity);try{if(!identity){authService.clearSession();setUser(null);setAccessToken(null)}else await rebuild(identity)}catch{await clearInvalid()}finally{setIsLoading(false)}});const invalid=(event:Event)=>{const status=(event as CustomEvent<{status:number}>).detail.status;void clearInvalid(status)};window.addEventListener("fantasy:session-invalid",invalid);return()=>{unsubscribe();window.removeEventListener("fantasy:session-invalid",invalid)}},[clearInvalid,rebuild]);

  const login=useCallback(async(email:string,password:string)=>{const logged=await authService.login(email,password);setFirebaseUser(auth.currentUser);if(!logged)return false;setUser(logged);setAccessToken(authService.getToken());return true},[]);
  const register=useCallback(async(nome:string,email:string,senha:string)=>{await authService.register(nome,email,senha);setFirebaseUser(auth.currentUser);setUser(null);setAccessToken(null)},[]);
  const loginWithGoogle=useCallback(async()=>{const logged=await authService.loginWithGoogle();setFirebaseUser(auth.currentUser);setUser(logged);setAccessToken(authService.getToken())},[]);
  const resendVerification=useCallback(async()=>{await authService.resendVerification()},[]);
  const checkEmailVerification=useCallback(async()=>{const verified=await authService.checkEmailVerification();setFirebaseUser(auth.currentUser);if(verified){setUser(authService.getStoredUser());setAccessToken(authService.getToken())}return verified},[]);
  const forgotPassword=useCallback((email:string)=>authService.forgotPassword(email),[]);
  const logout = useCallback(async () => {
    await authService.logout();
    setFirebaseUser(null);
    setUser(null);
    setAccessToken(null);
  }, []);
  const value = useMemo(() => ({ firebaseUser,user,accessToken,isAuthenticated:Boolean(user&&accessToken),isLoading,login,register,loginWithGoogle,resendVerification,checkEmailVerification,forgotPassword,logout,getToken:authService.getToken }), [firebaseUser,user,accessToken,isLoading,login,register,loginWithGoogle,resendVerification,checkEmailVerification,forgotPassword,logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
