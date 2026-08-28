"use client";
import { useState } from "react";
import { Link2, Plus, X } from "lucide-react";
import styles from "./AddTeamButton.module.css";
export function AddTeamButton() {
  const [open, setOpen] = useState(false);
  return <><button className={styles.trigger} onClick={() => setOpen(true)}><Plus size={19} />Adicionar time</button>{open && <div className={styles.backdrop} onMouseDown={() => setOpen(false)}><div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="connect-title" onMouseDown={(event) => event.stopPropagation()}><button className={styles.close} onClick={() => setOpen(false)} aria-label="Fechar"><X size={20} /></button><span className={styles.icon}><Link2 size={29} /></span><h2 id="connect-title">Conectar com o Cartola</h2><p>Em breve você poderá conectar sua conta do Cartola e adicionar seus times ao POINT FFC.</p><button className={styles.understood} onClick={() => setOpen(false)}>Entendi</button></div></div>}</>;
}
