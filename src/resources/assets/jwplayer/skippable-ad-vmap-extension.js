window.jwVastExtensionHandlers={skippable:(e,n)=>{var t=function(e){var n=e.split(":");return 60*+n[0]*60+60*+n[1]+ +n[2]},r=n.getElementsByTagName("MinAdLength");if(!r)return e;var i=n.getElementsByTagName("SkipOffset");if(!i)return e;for(var a=t(r.item(0).innerHTML),s=t(i.item(0).innerHTML),f=0;f<e.length;f++){var o=e[f];o.skipoffset||(o.duration<a||(o.skipoffset=s))}return e}};