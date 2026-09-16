"use client";

import { TriangleAlert } from "lucide-react";
import React from "react";
import styles from "./MyTeamsManager.module.css";

export function TeamOwnershipNotice({ plural = false, checked, disabled, onChange }: { plural?: boolean; checked: boolean; disabled: boolean; onChange(value: boolean): void }) {
  return <><div className={styles.ownershipNotice}><TriangleAlert aria-hidden="true" /><div><strong>ATENÇÃO</strong><p>{plural
    ? "Para receber qualquer premiação, será necessário comprovar a titularidade dos times cadastrados. Caso a titularidade não seja comprovada, a premiação não será paga."
    : "Para receber qualquer premiação, será necessário comprovar a titularidade do time cadastrado. Caso a titularidade não seja comprovada, a premiação não será paga."}</p></div></div>
    <label className={styles.ownershipDeclaration}><input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span>{plural
      ? "Declaro que sou o titular dos times informados e estou ciente da necessidade de comprovação para receber premiações."
      : "Declaro que sou o titular deste time e estou ciente da necessidade de comprovação para receber premiações."}</span></label></>;
}
