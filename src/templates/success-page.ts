import { wrapInLayout } from './layout';
import { brandColor, animationStyles, icons } from './styles';

export function successPage(businessName?: string, primaryColor?: string): string {
  const color = primaryColor || brandColor;
  const title = businessName ? `${businessName} - Thank You` : 'Thank You';

  const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;

  const body = `
<style>${animationStyles}</style>
<div class="site-page-wrapper" style="background-color: #fafafa;">
  <div style="text-align: center; padding: 3rem 2rem; max-width: 500px;">
    <div style="width: 64px; height: 64px; border-radius: 50%; background-color: ${color}20; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
      ${checkIcon}
    </div>
    <h1 style="color: #1f2937; font-size: 1.75rem; font-weight: 700; margin-bottom: 0.75rem;">
      Thank You!
    </h1>
    <p style="color: #6b7280; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">
      Your message has been received. We&#39;ll get back to you as soon as possible.
    </p>
    <a href="/" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background-color: ${color}; color: white; border-radius: 0.75rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; box-shadow: 0 4px 14px ${color}40;">
      ${icons.arrowLeft}
      Back to Homepage
    </a>
    <p style="margin-top: 3rem; font-size: 0.75rem; color: #9ca3af;">
      Powered by <span style="color: ${color}; font-weight: 600;">Alloro</span>
    </p>
  </div>
</div>`;

  return wrapInLayout(title, body);
}
