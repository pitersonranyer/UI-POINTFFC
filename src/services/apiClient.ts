const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
interface ApiOptions extends RequestInit { authenticated?: boolean; preserveSessionOnForbidden?: boolean }
let refreshSession: null | (()=>Promise<string|null>) = null;
export function setSessionRefresher(refresher:()=>Promise<string|null>){refreshSession=refresher}
export class ApiError extends Error {
  constructor(public readonly status:number,message="Erro na API",public readonly details:Record<string,unknown> = {}){super(message);this.name="ApiError"}
}
async function responseError(response:Response){try{const body=await response.json() as Record<string,unknown>;const value=body?.message;return new ApiError(response.status,Array.isArray(value)?String(value[0]):typeof value === "string"?value:"Erro na API",body ?? {})}catch{return new ApiError(response.status)}}
export async function apiFetch<T>(path:string,options:ApiOptions={},retried=false):Promise<T>{
  if(!apiUrl)throw new Error("NEXT_PUBLIC_API_URL não configurada");
  const {authenticated=false,preserveSessionOnForbidden=false,...init}=options;const headers=new Headers(init.headers);headers.set("Content-Type","application/json");
  const sessionToken=authenticated?sessionStorage.getItem("fantasy.accessToken"):null;
  if(sessionToken)headers.set("Authorization",`Bearer ${sessionToken}`);
  let response:Response;try{response=await fetch(`${apiUrl}${path}`,{...init,headers})}catch{throw new ApiError(0,"Não foi possível conectar ao servidor. Tente novamente.")}
  if(!response.ok){
    if(sessionToken&&response.status===401&&!retried&&refreshSession){const token=await refreshSession();if(token)return apiFetch<T>(path,options,true)}
    const error=await responseError(response);
    if(sessionToken&&(response.status===401||(response.status===403&&!preserveSessionOnForbidden)))window.dispatchEvent(new CustomEvent("fantasy:session-invalid",{detail:{status:response.status}}));
    throw error
  }
  if(response.status===204)return undefined as T;
  const text=await response.text();
  return (text?JSON.parse(text):undefined) as T;
}
