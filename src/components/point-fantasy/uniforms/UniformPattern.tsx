import React from "react";
import type { ClubUniform } from "./clubUniforms";

export function UniformPattern({ uniform: u }: { uniform: ClubUniform }) {
  const colors = [u.secondary, ...(u.additional ? [u.additional] : [])];
  return <g data-pattern={u.pattern}>
    {u.pattern === "vertical" && Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 12} y="0" width={u.additional ? 6 : 7} height="120" fill={colors[i % colors.length]} />)}
    {u.pattern === "horizontal" && [20, 44, 68, 92].map(y => <rect key={y} y={y} width="120" height="12" fill={u.secondary} />)}
    {u.pattern === "diagonal" && <path d="M-10 98L98-10L118 10L10 118Z" fill={u.secondary} />}
    {u.pattern === "chest" && <><rect y="36" width="120" height="12" fill={u.secondary} /><rect y="48" width="120" height="12" fill={u.additional ?? u.secondary} /></>}
  </g>;
}
