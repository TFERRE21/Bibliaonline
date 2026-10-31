import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase=createClient("https://uyombmebgdiaozuwcjzq.supabase.co","sb_publishable_zQ2sYw4LcciMWxxdBOQ2KA_N1_FAIcs");
async function currentUser(){const {data:{user}}=await supabase.auth.getUser();return user;}
async function saveItem(item){const user=await currentUser();if(!user){alert("Entre na sua conta para salvar este conteúdo nos seus favoritos.");location.href="conta.html";return {error:{message:"Faça login para salvar."}};}
const row={user_id:user.id,item_type:item.item_type,item_key:item.item_key,title:item.title,reference_label:item.reference_label||null,content:item.content||null,item_url:item.item_url||null,metadata:item.metadata||{}};
const {data,error}=await supabase.from("user_library_items").upsert(row,{onConflict:"user_id,item_type,item_key"}).select().single();return {data,error};}
async function removeItem(type,key){const user=await currentUser();if(!user)return {error:{message:"Faça login."}};return await supabase.from("user_library_items").delete().eq("user_id",user.id).eq("item_type",type).eq("item_key",key);}
async function getItems(){const user=await currentUser();if(!user)return {data:[],error:{message:"Faça login."}};return await supabase.from("user_library_items").select("*").order("created_at",{ascending:false});}
async function syncGuestFavorites(){
 try{
  const guest=JSON.parse(localStorage.getItem("bibleFavorites")||"[]");
  if(!Array.isArray(guest)||!guest.length)return;
  for(const item of guest){
   const result=await saveItem({item_type:"favorite_verse",item_key:item.key,title:item.book+" "+item.chapter+":"+item.verse,reference_label:item.book+" "+item.chapter+":"+item.verse,content:item.text,item_url:"conta.html#favoritos",metadata:{book:item.book,chapter:item.chapter,verse:item.verse,version:item.version}});
   if(result.error)throw result.error;
  }
  localStorage.setItem("bibleFavoritesSyncedAt",new Date().toISOString());
 }catch(error){console.warn("Sincronização de favoritos locais pendente:",error.message||error);}
}
window.bibleAccount={supabase,currentUser,saveItem,removeItem,getItems,syncGuestFavorites};
const outlineLabels={esperanca:["Esperança em tempos difíceis","Romanos 5:1–5"],sabedoria:["O valor da sabedoria","Provérbios 2:1–6"],servir:["Servir com amor","Marcos 10:42–45"]};
Object.entries(outlineLabels).forEach(([id,info])=>{const article=document.getElementById(id);if(!article)return;const button=document.createElement("button");button.type="button";button.className="btn btn-primary save-library-item";button.textContent="☆ Salvar na minha biblioteca";button.style.marginTop="16px";button.addEventListener("click",async()=>{button.disabled=true;const result=await saveItem({item_type:"outline",item_key:id,title:info[0],reference_label:info[1],content:article.innerText,item_url:"esbocos.html#"+id});button.disabled=false;if(result.error){if(!/Faça login/.test(result.error.message))alert(result.error.message);return;}button.textContent="✓ Salvo na minha biblioteca";});article.append(button);});

const pageType=({"/pregacoes.html":"sermon","/estudos.html":"study","/devocionais.html":"devotional","/mensagens.html":"message"})[location.pathname];
if(pageType){document.querySelectorAll("main article.feature-card[id]").forEach(article=>{const heading=article.querySelector("h2");if(!heading)return;const button=document.createElement("button");button.type="button";button.className="btn btn-primary save-library-item";button.textContent="☆ Salvar na minha biblioteca";button.style.marginTop="16px";button.addEventListener("click",async()=>{button.disabled=true;const reference=article.querySelector("strong")?.parentElement?.innerText||"";const result=await saveItem({item_type:pageType,item_key:location.pathname+"#"+article.id,title:heading.innerText,reference_label:reference,content:article.innerText,item_url:location.pathname+"#"+article.id});button.disabled=false;if(result.error){if(!/Faça login/.test(result.error.message))alert(result.error.message);return;}button.textContent="✓ Salvo na minha biblioteca";});article.append(button);});}

supabase.auth.onAuthStateChange((_event,session)=>{if(session?.user)syncGuestFavorites();});
