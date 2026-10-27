import { eq } from 'drizzle-orm';
import { getDb, schema } from '@/lib/db';
import { mergeContent } from '@/lib/site-data';
import ContentForm from '@/components/admin/ContentForm';

export default async function Content() {
  const db = await getDb();
  const [row] = await db.select().from(schema.siteContent).where(eq(schema.siteContent.id, 1));
  const content = mergeContent(row?.data);
  return (
    <>
      <div className="a-head"><div><h1>Site text</h1><p>The words around the map and in the Our story, Lab notes and Say hello panels.</p></div></div>
      <ContentForm content={content} />
    </>
  );
}
