'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Find the first sentence (ending with . ! or ? followed by space/newline/end)
  const firstSentenceMatch = content.match(/^([^.!?\n]*[.!?])(\s|$|\n)/);
  
  const commonClasses = cn(
    "prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert",
    "prose-headings:font-semibold prose-headings:mt-8 prose-headings:mb-4",
    "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
    "prose-p:my-4 prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300",
    "prose-ul:list-disc prose-ul:ml-6 prose-ul:my-4",
    "prose-ol:list-decimal prose-ol:ml-6 prose-ol:my-4",
    "prose-li:my-2",
    "prose-code:bg-gray-100 prose-code:dark:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-red-600 dark:prose-code:text-red-400",
    "prose-pre:bg-gray-900 prose-pre:dark:bg-gray-950 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-4",
    "prose-pre:border prose-pre:border-gray-800",
    "prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:dark:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:my-4 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400",
    "prose-a:text-blue-600 prose-a:dark:text-blue-400 prose-a:no-underline hover:prose-a:underline",
    "prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-gray-100",
    "prose-em:italic",
    "prose-hr:border-gray-300 prose-hr:dark:border-gray-600 prose-hr:my-8",
    "prose-table:w-full prose-table:border-collapse prose-table:my-4",
    "prose-thead:border-b prose-thead:border-gray-300 prose-thead:dark:border-gray-600",
    "prose-th:border prose-th:border-gray-300 prose-th:dark:border-gray-600 prose-th:px-4 prose-th:py-2 prose-th:bg-gray-50 prose-th:dark:bg-gray-800 prose-th:font-semibold prose-th:text-left",
    "prose-td:border prose-td:border-gray-300 prose-td:dark:border-gray-600 prose-td:px-4 prose-td:py-2",
    "prose-img:max-w-full prose-img:h-auto prose-img:rounded-lg prose-img:my-4",
    "[&_pre_code]:!bg-transparent [&_pre_code]:!p-0",
    className
  );

  const commonComponents = {
    // Custom heading styles
    h1: ({ children }: any) => <h1 className="text-3xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white">{children}</h3>,
    // Custom paragraph to preserve line breaks
    p: ({ children }: any) => <p className="whitespace-pre-wrap my-4 leading-relaxed text-gray-700 dark:text-gray-300">{children}</p>,
    // Custom anchor/link component to ensure links are clickable
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline hover:underline"
        {...props}
      >
        {children}
      </a>
    ),
    // Custom code block
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 border border-gray-800">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      ) : (
        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 dark:text-red-400" {...props}>
          {children}
        </code>
      )
    },
  };

  // If first sentence found, render separately: first without remark-breaks, rest with it
  if (firstSentenceMatch) {
    const firstSentence = firstSentenceMatch[0];
    const restOfContent = content.slice(firstSentence.length);
    
    return (
      <div className={commonClasses}>
        {/* First sentence without remark-breaks */}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSanitize]}
          components={commonComponents}
        >
          {firstSentence}
        </ReactMarkdown>
        {/* Rest of content with remark-breaks */}
        {restOfContent && (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSanitize]}
            components={commonComponents}
          >
            {restOfContent}
          </ReactMarkdown>
        )}
      </div>
    );
  }
  
  // No first sentence found, render normally with remark-breaks
  return (
    <div className={commonClasses}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw, rehypeSanitize]}
        components={commonComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

