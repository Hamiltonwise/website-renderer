import { notFound } from 'next/navigation';
import { getProjectByHostname } from '@/lib/services/project.service';
import { getPageToRender } from '@/lib/services/page.service';

interface SitePageProps {
  params: Promise<{
    hostname: string;
    path?: string[];
  }>;
}

export default async function SitePage({ params }: SitePageProps) {
  const { hostname, path } = await params;

  // Construct the page path from the catch-all segments
  const pagePath = path && path.length > 0 ? `/${path.join('/')}` : '/';

  // Look up the project by hostname
  const project = await getProjectByHostname(hostname);

  if (!project) {
    console.log(`[Site] Project not found for hostname: ${hostname}`);
    notFound();
  }

  // Check if project is ready
  if (project.status !== 'HTML_GENERATED' && project.status !== 'READY') {
    return (
      <html>
        <head>
          <title>Site Not Ready</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f5f5f5',
          margin: 0,
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ color: '#333', marginBottom: '1rem' }}>Site Not Ready</h1>
            <p style={{ color: '#666' }}>
              This site is still being built. Please check back later.
            </p>
            <p style={{ color: '#999', fontSize: '0.875rem', marginTop: '2rem' }}>
              Status: {project.status}
            </p>
          </div>
        </body>
      </html>
    );
  }

  // Get the page content
  const page = await getPageToRender(project.id, pagePath);

  if (!page) {
    // Try the home page as fallback for non-root paths
    if (pagePath !== '/') {
      const homePage = await getPageToRender(project.id, '/');
      if (homePage) {
        // For now, show home page for all paths (SPA-style)
        return (
          <html>
            <head>
              <meta charSet="utf-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body dangerouslySetInnerHTML={{ __html: homePage.html_content }} />
          </html>
        );
      }
    }

    return (
      <html>
        <head>
          <title>Page Not Found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f5f5f5',
          margin: 0,
        }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h1 style={{ color: '#333', marginBottom: '1rem' }}>Page Not Found</h1>
            <p style={{ color: '#666' }}>
              The requested page does not exist.
            </p>
          </div>
        </body>
      </html>
    );
  }

  // Render the page HTML
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body dangerouslySetInnerHTML={{ __html: page.html_content }} />
    </html>
  );
}

// Disable caching for dynamic site rendering
export const dynamic = 'force-dynamic';
