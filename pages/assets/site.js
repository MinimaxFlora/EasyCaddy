(function () {
"use strict";
var root=document.documentElement;root.classList.add("js");
var themeButton=document.querySelector(".theme-toggle"),saved=null;
try{saved=localStorage.getItem("easycaddy-theme")}catch(e){}
if(saved==="light"||saved==="dark")root.setAttribute("data-theme",saved);
else if(matchMedia&&matchMedia("(prefers-color-scheme: light)").matches)root.setAttribute("data-theme","light");
if(themeButton)themeButton.addEventListener("click",function(){var next=root.getAttribute("data-theme")==="light"?"dark":"light";root.setAttribute("data-theme",next);try{localStorage.setItem("easycaddy-theme",next)}catch(e){}});
var menu=document.querySelector(".menu-toggle"),nav=document.getElementById("nav");
if(menu&&nav){menu.addEventListener("click",function(){var opened=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!opened));nav.classList.toggle("open",!opened)});nav.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){menu.setAttribute("aria-expanded","false");nav.classList.remove("open")})})}
var toast=document.getElementById("toast"),toastTimer;
document.querySelectorAll("[data-copy]").forEach(function(button){button.addEventListener("click",async function(){var target=document.getElementById(button.getAttribute("data-copy"));if(!target)return;var value=target.innerText.replace(/\u00a0/g," ").trim();try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else{var area=document.createElement("textarea");area.value=value;area.style.position="fixed";area.style.opacity="0";document.body.appendChild(area);area.select();var ok=document.execCommand("copy");area.remove();if(!ok)throw Error("copy failed")}var original=button.getAttribute("data-label")||button.innerText;button.setAttribute("data-label",original);button.innerText="已复制";button.classList.add("copied");showToast("命令已复制到剪贴板");setTimeout(function(){button.innerText=original;button.classList.remove("copied")},1800)}catch(e){showToast("复制失败，请手动选择命令")}})});
function showToast(message){if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(function(){toast.classList.remove("show")},2100)}
var reveals=document.querySelectorAll(".reveal");
if("IntersectionObserver"in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches){var io=new IntersectionObserver(function(entries,observer){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}})},{threshold:.1});reveals.forEach(function(el){io.observe(el)})}else reveals.forEach(function(el){el.classList.add("visible")});
var progress=document.getElementById("progress");function updateProgress(){if(!progress)return;var max=document.documentElement.scrollHeight-innerHeight;progress.style.width=(max>0?Math.min(100,scrollY/max*100):0)+"%"}addEventListener("scroll",updateProgress,{passive:true});updateProgress();
var year=document.getElementById("year");if(year)year.textContent=String(new Date().getFullYear());
if("IntersectionObserver"in window){var links=document.querySelectorAll("#nav a[href^='#']"),sections=document.querySelectorAll("main section[id]");var navObserver=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)links.forEach(function(link){link.classList.toggle("active",link.getAttribute("href")==="#"+entry.target.id)})})},{rootMargin:"-25% 0px -65% 0px"});sections.forEach(function(section){navObserver.observe(section)})}
})();