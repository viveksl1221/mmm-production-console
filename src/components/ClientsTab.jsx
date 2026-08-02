import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ALL_CLIENTS, BLOG_TARGETS, POST_TARGETS } from '../data/campaign.js';
import { CLIENT_LOGOS } from '../lib/clientLogos.js';
import { postKey, slug } from '../lib/derived.js';
import ImportModal from './ImportModal.jsx';

export default function ClientsTab() {
  const { posts, blogs, content, setPostStatus } = useOutletContext();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <div className="clients-toolbar">
        <button className="add-post-btn" onClick={() => setImportOpen(true)}>Import calendar</button>
      </div>

      {ALL_CLIENTS.map((client) => {
        const items = content.getItems(client);
        const hasP = POST_TARGETS[client] !== undefined;
        const hasB = BLOG_TARGETS[client] !== undefined;

        let doneCount = 0;
        items.forEach((it) => {
          if ((posts[postKey(client, it.num)] || 'Planned') === 'Published') doneCount++;
        });

        const postTarget = POST_TARGETS[client] || 0;
        const blogTarget = BLOG_TARGETS[client] || 0;
        const blogCount = blogs[client] || 0;
        const totalDone = doneCount + blogCount;
        const totalTarget = postTarget + blogTarget;
        const pct = totalTarget ? Math.round((totalDone / totalTarget) * 100) : 0;

        const metaBits = [];
        if (hasP) metaBits.push(`${items.length}/${postTarget} posts planned`);
        if (hasB) metaBits.push(`${blogTarget} blogs`);

        return (
          <Link to={`/clients/${slug(client)}`} className="client-block" key={client}>
            <div className="client-head">
              <div className="client-title">
                {CLIENT_LOGOS[client] && <img className="client-logo" src={CLIENT_LOGOS[client]} alt="" />}
                <div>
                  <div className="client-name">{client}</div>
                  <div className="client-meta">{metaBits.join(' · ')}</div>
                </div>
              </div>
              <div className="wk-right">
                <div className="bar-wrap">
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  <div className="bar-num mono">{totalDone} / {totalTarget} shipped</div>
                </div>
                <div className="chev">▸</div>
              </div>
            </div>
          </Link>
        );
      })}

      {importOpen && <ImportModal content={content} setPostStatus={setPostStatus} onClose={() => setImportOpen(false)} />}
    </>
  );
}
