import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageFrame } from "../../inner-page";
import { cmsRequest } from "../../lib/supabase-rest";
import { ShareButton } from "../../share-button";
import { ProjectComments } from "../../project-comments";
type Post={title:string;summary:string;body:string;thumbnail_url:string;updated_at:string};
async function BlogPostContent({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const rows=await cmsRequest<Post[]>(`portfolio_content?select=title,summary,body,thumbnail_url,updated_at&type=eq.blog&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);const post=rows?.[0];if(!post)notFound();return <PageFrame number="04" label="FIELD NOTE" title={<>{post.title}<br/><em>{post.summary}</em></>}><article className="published-story"><p className="published-type">PUBLISHED {new Date(post.updated_at).toLocaleDateString("en",{month:"long",year:"numeric"})}</p>{post.thumbnail_url&&<div className="published-hero-image" style={{backgroundImage:`url("${post.thumbnail_url}")`}}/>}<div className="published-body">{post.body.split("\n").filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div><div className="share-row"><ShareButton/><Link href="/blog">← ALL FIELD NOTES</Link></div></article><ProjectComments slug={slug} type="blog"/></PageFrame>}
export default function BlogPost({params}:PageProps<"/blog/[slug]">){return <Suspense fallback={<main className="site-shell"><div className="wrap content-empty">Opening field note…</div></main>}><BlogPostContent params={params}/></Suspense>}
