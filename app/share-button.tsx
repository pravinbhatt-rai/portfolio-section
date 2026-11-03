"use client";
import { useState } from "react";
export function ShareButton(){const [copied,setCopied]=useState(false);async function share(){const url=location.href;try{if(navigator.share)await navigator.share({url});else{await navigator.clipboard.writeText(url);setCopied(true);setTimeout(()=>setCopied(false),1800);}}catch{}}return <button type="button" onClick={share}>{copied?"LINK COPIED ✓":"SHARE THIS ↗"}</button>}
