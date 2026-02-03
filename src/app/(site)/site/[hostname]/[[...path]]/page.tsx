import { getProjectByHostname } from '@/lib/services/project.service';
import { getPageToRender } from '@/lib/services/page.service';
import type { Project } from '@/types';
import type { Metadata } from 'next';

interface SitePageProps {
  params: Promise<{
    hostname: string;
    path?: string[];
  }>;
}

// Brand color
const brandColor = '#d66853';
const brandColorLight = '#fdf3f1';

// Helper to extract business name from project
function getBusinessName(project: Project): string | undefined {
  if (project.step_gbp_scrape && typeof project.step_gbp_scrape === 'object') {
    return (project.step_gbp_scrape as { name?: string }).name;
  }
  return undefined;
}

// SVG Icons as inline strings (from Lucide)
const icons = {
  rocket: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>`,
  search: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>`,
  clock: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  searchX: `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  arrowLeft: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`,
};

// Status messages mapping
const statusMessages: Record<string, { title: string; message: string; icon: string }> = {
  CREATED: {
    title: 'Getting Started',
    message: "We're setting up your website. This usually takes just a moment.",
    icon: icons.rocket,
  },
  GBP_SELECTED: {
    title: 'Building Your Site',
    message: "We're gathering information about your business to create the perfect website.",
    icon: icons.search,
  },
  GENERATING: {
    title: 'Creating Your Website',
    message: 'Our AI is crafting a beautiful, custom website just for you.',
    icon: icons.sparkles,
  },
  DEFAULT: {
    title: 'Almost There',
    message: 'Your website is being prepared. Please check back in a few moments.',
    icon: icons.clock,
  },
};

// CSS for animations
const animationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  .site-page-wrapper {
    margin: 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .icon-bounce { animation: bounce 2s ease-in-out infinite; }
  .icon-float { animation: float 3s ease-in-out infinite; }
  .progress-fill { animation: pulse 1.5s ease-in-out infinite; }
  .status-dot { animation: pulse 1s ease-in-out infinite; }
  .bg-gradient {
    background: linear-gradient(135deg, ${brandColorLight} 0%, #ffffff 50%, ${brandColorLight} 100%);
    background-size: 400% 400%;
    animation: gradient 15s ease infinite;
  }
`;

function SiteNotReadyPage({ status, businessName }: { status: string; businessName?: string }) {
  const statusInfo = statusMessages[status] || statusMessages.DEFAULT;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="site-page-wrapper bg-gradient">
        <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px' }}>
          {/* Animated Icon */}
          <div
            className="icon-bounce"
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}
            dangerouslySetInnerHTML={{ __html: statusInfo.icon }}
          />

          {/* Title */}
          <h1 style={{
            color: '#1f2937',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '1rem',
            letterSpacing: '-0.025em',
          }}>
            {statusInfo.title}
          </h1>

          {/* Message */}
          <p style={{
            color: '#6b7280',
            fontSize: '1.125rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            {statusInfo.message}
          </p>

          {/* Loading Indicator */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              width: '200px',
              height: '6px',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}>
              <div
                className="progress-fill"
                style={{
                  width: '40%',
                  height: '100%',
                  backgroundColor: brandColor,
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>

          {/* Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'white',
            borderRadius: '9999px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}>
            <div
              className="status-dot"
              style={{
                width: '8px',
                height: '8px',
                backgroundColor: brandColor,
                borderRadius: '50%',
              }}
            />
            <span>Status: {status.replace(/_/g, ' ')}</span>
          </div>

          {/* Footer */}
          <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#9ca3af' }}>
            Powered by <span style={{ color: brandColor, fontWeight: 600 }}>Alloro</span>
          </p>
        </div>
      </div>
    </>
  );
}

function SiteNotFoundPage({ hostname }: { hostname: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="site-page-wrapper" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)' }}>
        <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px' }}>
          {/* Floating Icon */}
          <div
            className="icon-float"
            style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}
            dangerouslySetInnerHTML={{ __html: icons.searchX }}
          />

          {/* Title */}
          <h1 style={{
            color: '#1f2937',
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '1rem',
            letterSpacing: '-0.025em',
          }}>
            Site Not Found
          </h1>

          {/* Message */}
          <p style={{
            color: '#6b7280',
            fontSize: '1.125rem',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}>
            We couldn&apos;t find a site at this address.
          </p>

          {/* Hostname Display */}
          <div style={{
            display: 'inline-block',
            padding: '0.75rem 1.25rem',
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            marginBottom: '2rem',
          }}>
            <code style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            }}>
              {hostname}
            </code>
          </div>

          {/* Help Text */}
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6 }}>
            If you believe this is an error, please check the URL or contact support.
          </p>

          {/* Footer */}
          <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#9ca3af' }}>
            Powered by <span style={{ color: brandColor, fontWeight: 600 }}>Alloro</span>
          </p>
        </div>
      </div>
    </>
  );
}

function PageNotFoundPage({ businessName }: { businessName?: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      <div className="site-page-wrapper" style={{ backgroundColor: '#fafafa' }}>
        <div style={{ textAlign: 'center', padding: '3rem 2rem', maxWidth: '500px' }}>
          {/* 404 Display */}
          <div style={{
            fontSize: '6rem',
            fontWeight: 800,
            color: brandColor,
            lineHeight: 1,
            marginBottom: '1rem',
            opacity: 0.2,
          }}>
            404
          </div>

          {/* Title */}
          <h1 style={{
            color: '#1f2937',
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}>
            Page Not Found
          </h1>

          {/* Message */}
          <p style={{
            color: '#6b7280',
            fontSize: '1rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          {/* Back Button */}
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: brandColor,
              color: 'white',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: `0 4px 14px ${brandColor}40`,
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: icons.arrowLeft }} />
            Go to Homepage
          </a>

          {/* Footer */}
          <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#9ca3af' }}>
            Powered by <span style={{ color: brandColor, fontWeight: 600 }}>Alloro</span>
          </p>
        </div>
      </div>
    </>
  );
}

// Generate dynamic metadata based on the page content
export async function generateMetadata({ params }: SitePageProps): Promise<Metadata> {
  const { hostname } = await params;
  const project = await getProjectByHostname(hostname);

  if (!project) {
    return { title: 'Site Not Found', robots: 'noindex' };
  }

  const businessName = getBusinessName(project);

  if (project.status !== 'HTML_GENERATED' && project.status !== 'READY') {
    return {
      title: businessName ? `${businessName} - Coming Soon` : 'Site Coming Soon',
      robots: 'noindex'
    };
  }

  return { title: businessName || 'Site' };
}

export default async function SitePage({ params }: SitePageProps) {
  const { hostname, path } = await params;

  // Construct the page path from the catch-all segments
  const pagePath = path && path.length > 0 ? `/${path.join('/')}` : '/';

  // Look up the project by hostname
  const project = await getProjectByHostname(hostname);

  if (!project) {
    console.log(`[Site] Project not found for hostname: ${hostname}`);
    return <SiteNotFoundPage hostname={hostname} />;
  }

  // Extract business name from GBP data
  const businessName = getBusinessName(project);

  // Check if project is ready
  if (project.status !== 'HTML_GENERATED' && project.status !== 'READY') {
    return <SiteNotReadyPage status={project.status} businessName={businessName} />;
  }

  // Get the page content
  const page = await getPageToRender(project.id, pagePath);

  if (!page) {
    // Try the home page as fallback for non-root paths
    if (pagePath !== '/') {
      const homePage = await getPageToRender(project.id, '/');
      if (homePage) {
        // Render customer's HTML content directly
        return <div dangerouslySetInnerHTML={{ __html: homePage.html_content }} />;
      }
    }

    return <PageNotFoundPage businessName={businessName} />;
  }

  // Render the customer's HTML content directly
  return <div dangerouslySetInnerHTML={{ __html: page.html_content }} />;
}

// Disable caching for dynamic site rendering
export const dynamic = 'force-dynamic';
