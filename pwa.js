(()=>{
 let deferredPrompt=null;
 const button=document.getElementById("installAppButton"),status=document.getElementById("installAppStatus");
 const show=message=>{if(status){status.textContent=message;status.hidden=false;}};
 const installed=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;
 if("serviceWorker"in navigator&&location.protocol==="https:"){
  window.addEventListener("load",()=>navigator.serviceWorker.register("/service-worker.js",{scope:"/"}).then(reg=>reg.update()).catch(()=>show("Não foi possível preparar a instalação agora. Atualize a página e tente novamente.")));
 }
 if(!button)return;
 if(installed()){button.hidden=true;return;}
 button.hidden=false;
 window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();deferredPrompt=event;button.textContent="⬇ Instalar Conecta Bíblia";button.dataset.ready="true";
 });
 window.addEventListener("appinstalled",()=>{deferredPrompt=null;button.hidden=true;show("Conecta Bíblia instalado! Você já pode abrir pelo ícone do seu dispositivo.");});
 button.addEventListener("click",async()=>{
  if(deferredPrompt){
   deferredPrompt.prompt();
   const choice=await deferredPrompt.userChoice;
   show(choice.outcome==="accepted"?"Instalação iniciada!":"A instalação não foi concluída. Você pode tentar novamente pelo menu do navegador.");
   deferredPrompt=null;return;
  }
  const ua=navigator.userAgent;
  if(/iphone|ipad|ipod/i.test(ua))show("Para instalar no iPhone: abra esta página no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.");
  else if(/android/i.test(ua))show("Para instalar no Android: no Chrome, toque no menu ⋮ e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.");
  else show("No Chrome para computador, use o ícone de instalação na barra de endereço ou Menu ⋮ → Transmitir, salvar e compartilhar → Instalar página como app.");
 });
})();
