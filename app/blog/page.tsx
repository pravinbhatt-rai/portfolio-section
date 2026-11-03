import { PageFrame } from "../inner-page";
import { ContentList } from "../content-list";
export default function Blog(){return <PageFrame number="04" label="FIELD NOTES" title={<>Ideas from<br/><em>the work.</em></>}><p className="inner-lede">Small discoveries, project stories, and practical lessons from building dependable software.</p><ContentList type="blog" empty="No notes published yet."/></PageFrame>}
