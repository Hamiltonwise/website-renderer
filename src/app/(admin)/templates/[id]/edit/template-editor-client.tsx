'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  LayoutTemplate,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Undo2,
  Globe,
  FileText,
} from 'lucide-react';
import type { Template } from '@/types';
import { updateTemplateContentAction, publishTemplateAction, unpublishTemplateAction } from '../../actions';

// Dynamic import of Monaco Editor to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] bg-gray-900 flex items-center justify-center">
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading editor...</span>
      </div>
    </div>
  ),
});

interface TemplateEditorClientProps {
  template: Template;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function TemplateEditorClient({ template }: TemplateEditorClientProps) {
  const router = useRouter();
  const [htmlContent, setHtmlContent] = useState(template.html_template || DEFAULT_TEMPLATE);
  const [isSaving, setIsSaving] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(template.status);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  // Store editor reference for keyboard shortcuts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);

  // Track unsaved changes
  useEffect(() => {
    const originalContent = template.html_template || DEFAULT_TEMPLATE;
    setHasUnsavedChanges(htmlContent !== originalContent);
  }, [htmlContent, template.html_template]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Validate HTML
  const validateHtml = useCallback((html: string): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!html.trim()) {
      return { isValid: false, errors: ['HTML content is required'], warnings: [] };
    }

    // Check for basic HTML structure
    const hasHtmlTag = /<html[\s>]/i.test(html);
    const hasHeadTag = /<head[\s>]/i.test(html);
    const hasBodyTag = /<body[\s>]/i.test(html);
    const hasDoctype = /<!DOCTYPE\s+html>/i.test(html);

    if (!hasDoctype) {
      warnings.push('Missing <!DOCTYPE html>');
    }
    if (!hasHtmlTag) {
      warnings.push('Missing <html> tag');
    }
    if (!hasHeadTag) {
      warnings.push('Missing <head> tag');
    }
    if (!hasBodyTag) {
      warnings.push('Missing <body> tag');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  const validation = useMemo(() => validateHtml(htmlContent), [htmlContent, validateHtml]);

  const handleSave = useCallback(async () => {
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateTemplateContentAction(template.id, htmlContent);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch {
      setError('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  }, [validation, template.id, htmlContent]);

  const handleTogglePublish = async () => {
    if (currentStatus === 'draft' && !validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsTogglingPublish(true);
    setError(null);

    try {
      if (currentStatus === 'draft') {
        // First save the content, then publish
        await updateTemplateContentAction(template.id, htmlContent);
        await publishTemplateAction(template.id);
        setCurrentStatus('published');
        setHasUnsavedChanges(false);
      } else {
        // Unpublish (set to draft)
        await unpublishTemplateAction(template.id);
        setCurrentStatus('draft');
      }
    } catch {
      setError(`Failed to ${currentStatus === 'draft' ? 'publish' : 'unpublish'} template`);
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const handleOpenPreview = () => {
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');
    if (previewWindow) {
      previewWindow.document.write(htmlContent);
      previewWindow.document.close();
    }
  };

  const handleReset = () => {
    if (confirm('Reset to default template? This will discard your current changes.')) {
      setHtmlContent(DEFAULT_TEMPLATE);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
            <LayoutTemplate className="w-6 h-6 text-brand-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            <p className="text-gray-600">
              {lastSaved
                ? `Last saved ${lastSaved.toLocaleTimeString()}`
                : hasUnsavedChanges
                ? 'Unsaved changes'
                : 'No changes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenPreview}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </button>
        </div>
      </motion.div>

      {/* Editor Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden"
      >
        {/* Editor Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">HTML + Tailwind CSS</span>
            <span className="text-xs text-gray-500">{htmlContent.split('\n').length} lines</span>
            <span className="text-xs text-gray-500">{htmlContent.length} chars</span>
            {isEditorReady && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                Monaco Ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {validation.errors.length > 0 && (
              <span className="flex items-center gap-1 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
              </span>
            )}
            {validation.warnings.length > 0 && validation.errors.length === 0 && (
              <span className="flex items-center gap-1 text-sm text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
              </span>
            )}
            {validation.isValid && htmlContent.trim() && validation.warnings.length === 0 && (
              <span className="flex items-center gap-1 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                Valid
              </span>
            )}
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Monaco Code Editor */}
        <Editor
          height="600px"
          defaultLanguage="html"
          value={htmlContent}
          onChange={(value) => setHtmlContent(value || '')}
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            setIsEditorReady(true);

            // Add Ctrl/Cmd + S shortcut for saving
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
              handleSave();
            });
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, Monaco, 'Courier New', monospace",
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            bracketPairColorization: { enabled: true },
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 16, bottom: 16 },
            readOnly: isSaving || isTogglingPublish,
          }}
        />

        {/* Validation Messages */}
        {(validation.errors.length > 0 || validation.warnings.length > 0) && htmlContent.trim() && (
          <div className="px-4 py-3 border-t border-gray-700 bg-gray-800">
            <div className="flex flex-wrap gap-2">
              {validation.errors.map((err, i) => (
                <span key={`error-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/50 text-red-300 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {err}
                </span>
              ))}
              {validation.warnings.map((warn, i) => (
                <span key={`warn-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-900/50 text-yellow-300 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {warn}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <p className="text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Publication Status Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStatus === 'draft' ? (
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div>
              <h3 className="font-medium text-gray-900">
                {currentStatus === 'draft' ? 'Draft Template' : 'Published Template'}
              </h3>
              <p className="text-sm text-gray-500">
                {currentStatus === 'draft'
                  ? 'Publish to make available for use in projects'
                  : 'This template is available for use in projects'}
              </p>
            </div>
          </div>
          <button
            onClick={handleTogglePublish}
            disabled={isTogglingPublish || (currentStatus === 'draft' && !htmlContent.trim())}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed ${
              currentStatus === 'draft'
                ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white shadow-lg shadow-green-500/30 disabled:shadow-none'
                : 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700'
            }`}
          >
            {isTogglingPublish ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {currentStatus === 'draft' ? 'Publishing...' : 'Unpublishing...'}
              </>
            ) : currentStatus === 'draft' ? (
              <>
                <Globe className="w-5 h-5" />
                Publish Template
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Set to Draft
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{business_name}} | Professional Services</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Tailwind CSS Animated (animations library) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss-animated/1.1.2/tailwind-animated.min.css">
</head>
<body class="bg-white text-gray-900 font-sans">
  <!-- Navigation -->
  <nav class="bg-gray-900 text-white sticky top-0 z-50 animate-fade-down animate-duration-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-orange-500 animate-pulse animate-duration-[3000ms]">{{business_name}}</span>
        </div>
        <div class="hidden md:flex items-center gap-8">
          <a href="#about" class="hover:text-orange-500 transition-colors hover:animate-wiggle">About</a>
          <a href="#services" class="hover:text-orange-500 transition-colors hover:animate-wiggle">Services</a>
          <a href="#contact" class="hover:text-orange-500 transition-colors hover:animate-wiggle">Contact</a>
          <a href="tel:{{phone}}" class="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors animate-jump-in animate-delay-500">
            Call Now
          </a>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white py-24 md:py-32 overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse animate-duration-[4000ms]"></div>
      <div class="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse animate-duration-[5000ms] animate-delay-1000"></div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="max-w-3xl">
        <h1 class="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          <span class="animate-fade-right animate-delay-100 inline-block">Welcome to</span>
          <span class="text-orange-500 animate-fade-right animate-delay-300 inline-block animate-jump-in">{{business_name}}</span>
        </h1>
        <p class="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-up animate-delay-500 animate-duration-700">
          {{category}} serving {{city}}, {{state}} with excellence and dedication.
        </p>
        <div class="flex flex-wrap gap-4">
          <a href="tel:{{phone}}" class="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 animate-fade-up animate-delay-700 hover:animate-wiggle">
            <svg class="w-5 h-5 animate-bounce animate-duration-1000" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
            </svg>
            {{phone}}
          </a>
          <a href="#contact" class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white px-8 py-4 rounded-xl font-semibold transition-all animate-fade-up animate-delay-[900ms] hover:animate-pulse">
            Get Directions
            <svg class="w-5 h-5 animate-bounce animate-duration-[2000ms]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
    <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
  </section>

  <!-- About Section -->
  <section id="about" class="py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div class="animate-fade-right animate-duration-700">
          <h2 class="text-3xl md:text-4xl font-bold mb-6">
            About <span class="text-orange-500 animate-pulse animate-duration-[3000ms]">{{business_name}}</span>
          </h2>
          <p class="text-gray-600 text-lg mb-6 leading-relaxed">
            Located in {{city}}, {{state}}, we are committed to providing exceptional {{category}} services to our community. Our team of dedicated professionals ensures that every client receives personalized attention and the highest quality of service.
          </p>
          <div class="flex items-center gap-4 animate-jump-in animate-delay-500">
            <div class="flex items-center gap-1 text-yellow-500">
              <svg class="w-6 h-6 animate-spin animate-duration-[3000ms]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
              <span class="font-bold text-gray-900">{{rating}}</span>
            </div>
            <span class="text-gray-500">({{review_count}} reviews)</span>
          </div>
        </div>
        <div class="bg-gray-100 rounded-2xl p-8 animate-fade-left animate-duration-700 hover:animate-wiggle-more hover:shadow-xl transition-shadow">
          <h3 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg class="w-6 h-6 text-orange-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Business Hours
          </h3>
          <div class="space-y-2 text-gray-600">
            <p class="animate-fade-right animate-delay-100">Monday - Friday: 9:00 AM - 6:00 PM</p>
            <p class="animate-fade-right animate-delay-200">Saturday: 10:00 AM - 4:00 PM</p>
            <p class="animate-fade-right animate-delay-300">Sunday: Closed</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Services Section -->
  <section id="services" class="py-20 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 animate-fade-down animate-duration-500">Our Services</h2>
        <p class="text-gray-600 text-lg max-w-2xl mx-auto animate-fade-up animate-delay-200">
          We offer a comprehensive range of services to meet all your needs.
        </p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 animate-fade-up animate-delay-100 group">
          <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:animate-bounce">
            <svg class="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-3 group-hover:text-orange-500 transition-colors">Quality Service</h3>
          <p class="text-gray-600">Professional and reliable services tailored to your specific needs.</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 animate-fade-up animate-delay-300 group">
          <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:animate-spin group-hover:animate-duration-1000">
            <svg class="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-3 group-hover:text-orange-500 transition-colors">Fast Response</h3>
          <p class="text-gray-600">Quick turnaround times without compromising on quality.</p>
        </div>
        <div class="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 animate-fade-up animate-delay-500 group">
          <div class="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:animate-wiggle">
            <svg class="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold mb-3 group-hover:text-orange-500 transition-colors">Expert Team</h3>
          <p class="text-gray-600">Experienced professionals dedicated to your satisfaction.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-16 bg-orange-500 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 class="text-3xl md:text-4xl font-bold mb-4 animate-fade-down">Ready to Get Started?</h2>
      <p class="text-xl text-orange-100 mb-8 animate-fade-up animate-delay-200">Contact us today for a free consultation!</p>
      <a href="tel:{{phone}}" class="inline-flex items-center gap-3 bg-white text-orange-500 px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-110 animate-jump animate-delay-500 hover:animate-wiggle-more shadow-2xl">
        <svg class="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
        </svg>
        Call {{phone}}
      </a>
    </div>
  </section>

  <!-- Contact Section -->
  <section id="contact" class="py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-gray-900 text-white rounded-3xl p-8 md:p-12 animate-fade-up animate-duration-700 overflow-hidden relative">
        <!-- Decorative animated elements -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse animate-duration-[4000ms]"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/5 rounded-full blur-2xl animate-pulse animate-duration-[5000ms]"></div>

        <div class="grid md:grid-cols-2 gap-12 relative z-10">
          <div>
            <h2 class="text-3xl md:text-4xl font-bold mb-6 animate-fade-right">Get in Touch</h2>
            <p class="text-gray-300 mb-8 animate-fade-right animate-delay-200">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div class="space-y-4">
              <div class="flex items-center gap-4 animate-fade-right animate-delay-300 hover:translate-x-2 transition-transform">
                <div class="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center animate-pulse animate-duration-[3000ms]">
                  <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">Address</p>
                  <p class="font-medium">{{formatted_address}}</p>
                </div>
              </div>
              <div class="flex items-center gap-4 animate-fade-right animate-delay-500 hover:translate-x-2 transition-transform">
                <div class="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-orange-500 animate-wiggle animate-infinite" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-gray-400 text-sm">Phone</p>
                  <a href="tel:{{phone}}" class="font-medium hover:text-orange-500 transition-colors">{{phone}}</a>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-white/10 backdrop-blur rounded-2xl p-6 animate-fade-left animate-delay-300 hover:bg-white/15 transition-colors">
            <form class="space-y-4">
              <div class="animate-fade-up animate-delay-400">
                <input type="text" placeholder="Your Name" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all">
              </div>
              <div class="animate-fade-up animate-delay-500">
                <input type="email" placeholder="Your Email" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all">
              </div>
              <div class="animate-fade-up animate-delay-[600ms]">
                <textarea rows="4" placeholder="Your Message" class="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"></textarea>
              </div>
              <button type="submit" class="w-full bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-xl font-semibold transition-all hover:scale-[1.02] animate-fade-up animate-delay-700 hover:animate-pulse">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2 animate-fade-right">
          <span class="text-xl font-bold text-orange-500 animate-pulse animate-duration-[3000ms]">{{business_name}}</span>
        </div>
        <p class="text-gray-400 text-sm animate-fade-left">
          © 2024 {{business_name}}. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
</body>
</html>`;
