import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageFrame } from "../../inner-page";
import { cmsRequest } from "../../lib/supabase-rest";
import { ShareButton } from "../../share-button";
type Item={title:string;summary:string;body:string;thumbnail_url:string};
async function AchievementContent({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const rows=await cmsRequest<Item[]>(`portfolio_content?select=title,summary,body,thumbnail_url&type=eq.achievement&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);const item=rows?.[0];if(!item)notFound();return <PageFrame number="05" label="MILESTONE" title={<>{item.title}<br/><em>{item.summary}</em></>}><div className="published-story"><div className="published-body">{item.body.split("\n").filter(Boolean).map((text,index)=><p key={index}>{text}</p>)}</div><div className="share-row"><ShareButton/><Link href="/achievements">← ALL MILESTONES</Link></div></div></PageFrame>}
export default function AchievementPage({params}:PageProps<"/achievements/[slug]">){return <Suspense fallback={<main className="site-shell"><div className="wrap content-empty">Opening milestone…</div></main>}><AchievementContent params={params}/></Suspense>}
