import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase=createClient("https://uyombmebgdiaozuwcjzq.supabase.co","sb_publishable_zQ2sYw4LcciMWxxdBOQ2KA_N1_FAIcs");
async function currentUser(){const {data:{user}}=await supabase.auth.getUser();return user;}
async function saveItem(item){const user=await currentUser();if(!user){alert("Entre na sua conta para salvar este conteúdo nos seus favoritos.");location.href="conta.html";return {error:{message:"Faça login para salvar."}};}
const row={user_id:user.id,item_type:item.item_type,item_key:item.item_key,title:item.title,reference_label:item.reference_label||null,content:item.content||null,item_url:item.item_url||null,metadata:item.metadata||{}};
const {data,error}=await supabase.from("user_library_items").upsert(row,{onConflict:"user_id,item_type,item_key"}).select().single();return {data,error};}
async function removeItem(type,key){const user=await currentUser();if(!user)return {error:{message:"Faça login."}};return await supabase.from("user_library_items").delete().eq("user_id",user.id).eq("item_type",type).eq("item_key",key);}
async function getItems(){const user=await currentUser();if(!user)return {data:[],error:{message:"Faça login."}};return await supabase.from("user_library_items").select("*").order("created_at",{ascending:false});}
window.bibleAccount={supabase,currentUser,saveItem,removeItem,getItems};