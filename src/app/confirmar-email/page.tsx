"use client";

import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {AuthLayout} from "@/components/auth/AuthLayout";
import {useAuth} from "@/contexts/AuthContext";
import {authError} from "@/lib/authErrors";
import styles from "@/components/auth/AuthLayout.module.css";

export default function ConfirmarEmail(){
  const{firebaseUser,isAuthenticated,isLoading,checkEmailVerification,resendVerification,logout}=useAuth();
  const router=useRouter();
  const[checking,setChecking]=useState(false),[resending,setResending]=useState(false),[cooldown,setCooldown]=useState(0),[message,setMessage]=useState(""),[error,setError]=useState("");
  useEffect(()=>{if(!isLoading){if(isAuthenticated)router.replace("/dashboard");else if(!firebaseUser)router.replace("/login")}},[firebaseUser,isAuthenticated,isLoading,router]);
  useEffect(()=>{if(!cooldown)return;const timer=window.setInterval(()=>setCooldown(value=>Math.max(0,value-1)),1000);return()=>window.clearInterval(timer)},[cooldown]);
  async function check(){if(checking)return;setChecking(true);setError("");setMessage("");try{if(await checkEmailVerification())router.replace("/dashboard");else setError("Seu e-mail ainda não foi confirmado.")}catch(err){setError(authError(err))}finally{setChecking(false)}}
  async function resend(){if(resending||cooldown)return;setResending(true);setError("");setMessage("");try{await resendVerification();setMessage("E-mail de confirmação reenviado.");setCooldown(30)}catch(err){setError(authError(err))}finally{setResending(false)}}
  async function leave(){await logout();router.replace("/login")}
  return <AuthLayout eyebrow="ÚLTIMO PASSO" title="Confirme seu e-mail" subtitle={`Enviamos um link de confirmação para ${firebaseUser?.email||"seu e-mail"}. Acesse sua caixa de entrada e confirme seu cadastro para continuar.`}><div className={styles.form}>{error&&<div className={styles.error} role="alert">{error}</div>}{message&&<div className={styles.success} role="status">{message}</div>}<div className={styles.success}>Não encontrou? Verifique também sua caixa de spam.</div><button className={styles.submit} onClick={check} disabled={checking||resending}>{checking&&<span className={styles.spinner}/>} {checking?"Verificando...":"Já confirmei meu e-mail"}</button><button className={styles.google} onClick={resend} disabled={checking||resending||cooldown>0}>{resending?"Reenviando...":cooldown?`Reenviar em ${cooldown}s`:"Reenviar e-mail de confirmação"}</button><button className={styles.google} onClick={leave} disabled={checking||resending}>Sair</button></div></AuthLayout>
}
