import {getLLMText} from '@/lib/get-llm-text';
import {source} from '@/lib/source';
import {notFound} from 'next/navigation';

export const revalidate = false;

export async function GET(_req: Request, props: {params: Promise<{slug?: string[]}>}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Vary': 'Accept',
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
