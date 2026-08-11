import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = { user: User | null; loading: boolean; isAdmin: boolean; signIn: (email:string,password:string)=>Promise<{error:string|null}>; signOut:()=>Promise<void>; };
const AuthContext=createContext<AuthContextType|undefined>(undefined);
export function AuthProvider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null); const [loading,setLoading]=useState(true);
 useEffect(()=>{supabase.auth.getSession().then(({data}:{data:{session:Session|null}})=>{setUser(data.session?.user??null);setLoading(false);});const {data:sub}=supabase.auth.onAuthStateChange((_e,session)=>setUser(session?.user??null));return()=>sub.subscription.unsubscribe();},[]);
 const signIn=async(email:string,password:string)=>{const {error}=await supabase.auth.signInWithPassword({email,password});return {error:error?.message??null};};
 const signOut=async()=>{await supabase.auth.signOut();};
 return <AuthContext.Provider value={{user,loading,isAdmin:!!user,signIn,signOut}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('useAuth must be used within AuthProvider');return ctx;}
