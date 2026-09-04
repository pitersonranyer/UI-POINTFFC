const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
interface ApiOptions extends RequestInit { authenticated?: boolean }
let refreshSession: null | (()=>Promise<string|null>) = null;
export function setSessionRefresher(refresher:()=>Promise<string|null>){refreshSession=refresher}
export class ApiError extends Error {
  constructor(public readonly status:number,message="Erro na API"){super(message);this.name="ApiError"}
}
async function message(response:Response){try{const body=await response.json() as {message?:string|string[]};return Array.isArray(body.message)?body.message[0]:body.message||"Erro na API"}catch{return "Erro na API"}}
export async function apiFetch<T>(path:string,options:ApiOptions={},retried=false):Promise<T>{
  if(!apiUrl)throw new Error("NEXT_PUBLIC_API_URL não configurada");
  const {authenticated=false,...init}=options;const headers=new Headers(init.headers);headers.set("Content-Type","application/json");
  const sessionToken=authenticated?sessionStorage.getItem("fantasy.accessToken"):null;
  if(sessionToken)headers.set("Authorization",`Bearer ${sessionToken}`);
  let response:Response;try{response=await fetch(`${apiUrl}${path}`,{...init,headers})}catch{throw new ApiError(0,"Não foi possível conectar ao servidor. Tente novamente.")}
  if(!response.ok){
    if(sessionToken&&response.status===401&&!retried&&refreshSession){const token=await refreshSession();if(token)return apiFetch<T>(path,options,true)}
    const error=new ApiError(response.status,await message(response));
    if(sessionToken&&(response.status===401||response.status===403))window.dispatchEvent(new CustomEvent("fantasy:session-invalid",{detail:{status:response.status}}));
    throw error
  }
  if(response.status===204)return undefined as T;
  const text=await response.text();
  return (text?JSON.parse(text):undefined) as T;
}
