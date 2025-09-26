//pages/timeline.js - V1.0
import Head from 'next/head';
import Timeline from '../components/Timeline';
import CreatePost from '../components/CreatePost';

export default function TimelinePage() {
  return (
    <div>
      <Head>
        <title>Minha Timeline</title>
        <meta name="description" content="Feed de notícias no estilo Facebook." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div className="main-container">
          <CreatePost />
          <hr style={{ margin: '40px 0' }} />
          <Timeline />
        </div>
      </main>
    </div>
  );
}