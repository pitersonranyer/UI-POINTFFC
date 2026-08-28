"use client";
import Link from "next/link";import {AuthLayout} from "@/components/auth/AuthLayout";import styles from "@/components/auth/AuthLayout.module.css";
function FirebaseResetNotice(){return <><div className={styles.success}>A redefinição de senha é concluída na página segura do Firebase enviada ao seu e-mail.</div><p className={styles.switch}><Link href="/login">Voltar para o login</Link></p></>}
export default function RedefinirSenha(){return <AuthLayout eyebrow="RECUPERAÇÃO" title="Redefinir senha" subtitle="Use o link oficial recebido por e-mail para alterar sua senha."><FirebaseResetNotice/></AuthLayout>}
