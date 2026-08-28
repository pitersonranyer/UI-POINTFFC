export const validEmail=(value:string)=>/^\S+@\S+\.\S+$/.test(value);
export const validPassword=(value:string)=>value.length>=8&&/[A-Za-z]/.test(value)&&/\d/.test(value);
