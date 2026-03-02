import type { Section } from '../types';

/**
 * Generates an inline <script> that auto-intercepts all forms on the page
 * and POSTs their contents to the Alloro form-submission API.
 * Forms with `data-alloro-ignore` are skipped.
 *
 * Security layers injected:
 * - Honeypot hidden field (_hp) — bots fill it, humans don't
 * - Timestamp (_ts) — recorded at page load, validated server-side
 */
function buildFormScript(projectId: string, apiBase: string): string {
  return `<script data-alloro-form-handler>
(function(){
  'use strict';
  var _ts=Date.now();
  var _jsc=_ts;for(var i=0;i<1000;i++){_jsc=((_jsc*1103515245+12345)&0x7fffffff);}
  document.addEventListener('DOMContentLoaded',function(){
    var API='${apiBase}';
    var PID='${projectId}';
    var forms=document.querySelectorAll('form:not([data-alloro-ignore])');
    forms.forEach(function(form){
      var hp=document.createElement('input');
      hp.type='text';hp.name='website_url';hp.tabIndex=-1;hp.autocomplete='off';
      hp.setAttribute('aria-hidden','true');
      hp.style.cssText='position:absolute;left:-9999px;opacity:0;height:0;width:0;overflow:hidden;';
      form.appendChild(hp);
      var badge=document.createElement('a');
      badge.href='https://getalloro.com/alloro-protect';
      badge.target='_blank';badge.rel='noopener noreferrer';
      badge.style.cssText='display:flex;align-items:center;justify-content:center;gap:4px;margin-top:8px;text-decoration:none;opacity:0.45;transition:opacity 0.2s;';
      badge.onmouseenter=function(){badge.style.opacity='0.7';};
      badge.onmouseleave=function(){badge.style.opacity='0.45';};
      var svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('width','12');svg.setAttribute('height','12');svg.setAttribute('viewBox','0 0 32 32');svg.setAttribute('fill','none');
      var circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
      circle.setAttribute('cx','16');circle.setAttribute('cy','16');circle.setAttribute('r','15');circle.setAttribute('stroke','#999');circle.setAttribute('stroke-width','2');
      var path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d','M16 7l7 4v6c0 5.25-3 10.5-7 12-4-1.5-7-6.75-7-12v-6l7-4z');path.setAttribute('fill','#999');
      svg.appendChild(circle);svg.appendChild(path);
      var label=document.createElement('span');
      label.textContent='Protected by Alloro';
      label.style.cssText='font-size:11px;color:#999;font-family:system-ui,sans-serif;';
      badge.appendChild(svg);badge.appendChild(label);
      form.parentNode.insertBefore(badge,form.nextSibling);
      form.addEventListener('submit',function(e){
        e.preventDefault();
        var formName=form.getAttribute('data-form-name')||form.getAttribute('name')||'Contact Form';
        var contents={};
        var inputs=form.querySelectorAll('input,select,textarea');
        inputs.forEach(function(el){
          if(el.tabIndex===-1||el.type==='submit'||el.type==='hidden'||el.type==='button')return;
          var label=el.getAttribute('data-label')||el.getAttribute('name')||el.getAttribute('placeholder')||'';
          if(!label)return;
          if(el.type==='checkbox'){
            if(el.checked){
              contents[label]=contents[label]?contents[label]+', '+el.value:el.value;
            }
          }else if(el.type==='radio'){
            if(el.checked){
              contents[label]=el.value;
            }
          }else if(el.tagName==='SELECT'){
            var opt=el.options[el.selectedIndex];
            if(opt&&opt.value){
              contents[label]=opt.textContent.trim();
            }
          }else{
            var v=el.value.trim();
            if(v)contents[label]=v;
          }
        });
        var btn=form.querySelector('button[type="submit"],input[type="submit"]');
        var origText=btn?btn.textContent:'';
        if(btn){btn.disabled=true;btn.textContent='Sending...';}
        fetch(API+'/api/websites/form-submission',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({projectId:PID,formName:formName,contents:contents,_hp:hp.value,_ts:_ts,_jsc:_jsc})
        })
        .then(function(r){if(!r.ok)throw new Error('fail');return r.json();})
        .then(function(){
          window.location.href='/success';
        })
        .catch(function(){
          if(btn){btn.textContent='Error \\u2014 Try Again';btn.style.backgroundColor='#dc2626';}
          setTimeout(function(){if(btn){btn.disabled=false;btn.textContent=origText;btn.style.backgroundColor='';}},3000);
        });
      });
    });
  });
})();
</script>`;
}

/**
 * Unwrap sections whether stored as Section[] or { sections: Section[] }.
 * N8N writes directly to the DB with the wrapped format; our API writes the bare array.
 */
export function normalizeSections(raw: unknown): Section[] {
  if (Array.isArray(raw)) return raw;
  if (
    raw &&
    typeof raw === 'object' &&
    'sections' in raw &&
    Array.isArray((raw as { sections: unknown }).sections)
  ) {
    return (raw as { sections: Section[] }).sections;
  }
  return [];
}

/**
 * Inject code snippets into HTML at specified locations
 */
function injectCodeSnippets(
  html: string,
  snippets: any[],
  currentPageId?: string
): string {
  // 1. Filter enabled snippets
  const enabled = snippets.filter((s) => s.is_enabled);

  // 2. Filter by page targeting
  const targeted = enabled.filter((s) => {
    if (!s.page_ids || s.page_ids.length === 0) return true; // All pages
    if (!currentPageId) return true; // Show all in preview
    return s.page_ids.includes(currentPageId);
  });

  // 3. Group by location and sort by order_index
  const byLocation = {
    head_start: targeted
      .filter((s) => s.location === 'head_start')
      .sort((a, b) => a.order_index - b.order_index),
    head_end: targeted
      .filter((s) => s.location === 'head_end')
      .sort((a, b) => a.order_index - b.order_index),
    body_start: targeted
      .filter((s) => s.location === 'body_start')
      .sort((a, b) => a.order_index - b.order_index),
    body_end: targeted
      .filter((s) => s.location === 'body_end')
      .sort((a, b) => a.order_index - b.order_index),
  };

  // 4. Inject at each location
  let result = html;

  if (byLocation.head_start.length > 0) {
    const code = byLocation.head_start.map((s) => s.code).join('\n');
    result = result.replace(/<head>/i, `<head>\n${code}`);
  }

  if (byLocation.head_end.length > 0) {
    const code = byLocation.head_end.map((s) => s.code).join('\n');
    result = result.replace(/<\/head>/i, `${code}\n</head>`);
  }

  if (byLocation.body_start.length > 0) {
    const code = byLocation.body_start.map((s) => s.code).join('\n');
    result = result.replace(/<body([^>]*)>/i, `<body$1>\n${code}`);
  }

  if (byLocation.body_end.length > 0) {
    const code = byLocation.body_end.map((s) => s.code).join('\n');
    result = result.replace(/<\/body>/i, `${code}\n</body>`);
  }

  return result;
}

/**
 * Check if an HTML string's root element has data-alloro-hidden="true".
 */
function isHiddenElement(html: string): boolean {
  const openTagMatch = html.match(/^[\s]*<[^>]+>/);
  if (!openTagMatch) return false;
  return /data-alloro-hidden\s*=\s*["']true["']/.test(openTagMatch[0]);
}

/**
 * Remove any nested elements that have data-alloro-hidden="true" from an HTML string.
 * Uses a non-greedy regex that matches the opening tag through the corresponding
 * closing tag. Works reliably for alloro-tpl component wrappers which don't
 * nest other alloro-tpl elements inside them.
 */
function stripHiddenElements(html: string): string {
  // Match elements whose opening tag contains data-alloro-hidden="true".
  // Pattern: <tagname ...data-alloro-hidden="true"...>...content...</tagname>
  // We capture the tag name so we can match its closing tag.
  return html.replace(
    /<(\w+)\b[^>]*\bdata-alloro-hidden\s*=\s*["']true["'][^>]*>[\s\S]*?<\/\1>/g,
    ''
  );
}

/**
 * Assemble a full HTML page from project wrapper/header/footer and page sections.
 *
 * wrapper.replace('{{slot}}', header + sections + footer)
 *
 * @param codeSnippets – optional code snippets to inject
 * @param currentPageId – optional page ID for snippet targeting
 */
export function renderPage(
  wrapper: string,
  header: string,
  footer: string,
  sections: Section[],
  codeSnippets?: any[],
  currentPageId?: string,
  projectId?: string,
  apiBaseUrl?: string
): string {
  const visibleSections = sections.filter(
    (s) => !isHiddenElement(s.content)
  );
  const mainContent = visibleSections
    .map((s) => stripHiddenElements(s.content))
    .join('\n');
  const pageContent = [
    stripHiddenElements(header),
    mainContent,
    stripHiddenElements(footer),
  ].join('\n');

  if (!wrapper.includes('{{slot}}')) {
    return [
      '<!doctype html><html><head><meta charset="UTF-8"></head><body>',
      '<div style="max-width:600px;margin:80px auto;font-family:system-ui;text-align:center">',
      '<h1 style="font-size:1.5rem;color:#991b1b">Configuration Error</h1>',
      '<p style="color:#6b7280;margin-top:12px">The site wrapper is missing the <code>{{slot}}</code> placeholder. Page content cannot be rendered.</p>',
      '</div></body></html>',
    ].join('\n');
  }

  let finalHtml = wrapper.replace('{{slot}}', pageContent);

  // Inject code snippets
  if (codeSnippets && codeSnippets.length > 0) {
    finalHtml = injectCodeSnippets(finalHtml, codeSnippets, currentPageId);
  }

  // Inject default form submission handler on all pages
  // Skip if the deployment pipeline already baked it into the wrapper
  const alreadyHasScript = finalHtml.includes('data-alloro-form-handler');
  if (projectId && apiBaseUrl && !alreadyHasScript) {
    const formScript = buildFormScript(projectId, apiBaseUrl);
    finalHtml = finalHtml.replace(/<\/body>/i, `${formScript}\n</body>`);
  }

  return finalHtml;
}
