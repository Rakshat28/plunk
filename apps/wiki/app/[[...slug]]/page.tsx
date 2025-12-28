import {createRelativeLink} from 'fumadocs-ui/mdx';
import {DocsBody, DocsDescription, DocsPage, DocsTitle} from 'fumadocs-ui/page';
import {notFound} from 'next/navigation';

import {source} from '@/lib/source';
import {getMDXComponents} from '@/mdx-components';
import {LLMCopyButton, ViewOptions} from '@/components/page-actions';

export const dynamic = 'force-dynamic';

export default async function Page(props: {params: Promise<{slug?: string[]}>}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>

      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <LLMCopyButton markdownUrl={`/llms.mdx${page.url}`} />
        <ViewOptions
          markdownUrl={`/llms.mdx${page.url}`}
          githubUrl={`https://github.com/useplunk/plunk/blob/next/apps/wiki/content/docs/${page.path}`}
        />
      </div>

      <DocsBody>
        <MDXContent
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {params: Promise<{slug?: string[]}>}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
