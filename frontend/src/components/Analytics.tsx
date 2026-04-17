/**
 * @file: components/Analytics.tsx
 * @description: Yandex Metrika + VK Pixel (Top.Mail.Ru) script loader
 */

"use client";

import Script from "next/script";

const YM_ID = process.env.NEXT_PUBLIC_YM_ID || "";
const VK_PIXEL_ID = process.env.NEXT_PUBLIC_VK_PIXEL_ID || "";

export default function Analytics() {
  if (!YM_ID && !VK_PIXEL_ID) return null;

  return (
    <>
      {/* Yandex Metrika */}
      {YM_ID && (
        <>
          <Script
            id="yandex-metrika"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}','ym');ym(${YM_ID},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true,ecommerce:"dataLayer"});`,
            }}
          />
          <noscript>
            <div>
              <img
                src={`https://mc.yandex.ru/watch/${YM_ID}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
                width={1}
                height={1}
              />
            </div>
          </noscript>
        </>
      )}

      {/* VK Pixel / Top.Mail.Ru */}
      {VK_PIXEL_ID && (
        <>
          <Script
            id="vk-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `var _tmr=window._tmr||(window._tmr=[]);_tmr.push({id:"${VK_PIXEL_ID}",type:"pageView",start:(new Date()).getTime()});(function(d,w,id){if(d.getElementById(id))return;var ts=d.createElement("script");ts.type="text/javascript";ts.async=true;ts.id=id;ts.src="https://top-fwz1.mail.ru/js/code.js";var f=function(){var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(ts,s);};if(w.opera=="[object Opera]"){d.addEventListener("DOMContentLoaded",f,false);}else{f();}})(document,window,"tmr-code");`,
            }}
          />
          <noscript>
            <div>
              <img
                src={`https://top-fwz1.mail.ru/counter?id=${VK_PIXEL_ID};js=na`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
                width={1}
                height={1}
              />
            </div>
          </noscript>
        </>
      )}
    </>
  );
}
