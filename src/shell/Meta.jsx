import { useEffect } from 'react';

/** Per-route title and description, without pulling in a helmet library. */
export default function Meta({ title, description }) {
  useEffect(() => {
    const full = title ? `${title} · CuriosityQuest` : 'CuriosityQuest — hands-on STEM for curious young minds';
    document.title = full;
    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', description);
    }
  }, [title, description]);
  return null;
}
