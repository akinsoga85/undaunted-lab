import PostForm from '@/components/admin/PostForm';

export default function NewNote() {
  const blank = { id: 0, title: '', slug: '', tag: '', author: 'Opeyemi', summary: '', body: '', linkedin: '', linkedinUrl: '', published: false };
  return (
    <>
      <div className="a-head"><div><h1>Write a note</h1><p>Save it as a draft to preview it on the site. Nobody else sees it until you publish.</p></div></div>
      <PostForm post={blank} />
    </>
  );
}
