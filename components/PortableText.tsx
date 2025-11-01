import { PortableText as PortableTextComponent, PortableTextComponents } from '@portabletext/react';
import Image from 'next/image';
import { urlFor } from '@/lib/sanity.image';

interface PortableTextProps {
  value: any;
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }: any) => {
      if (!value?.asset?._ref) {
        return null;
      }
      return (
        <div className="my-8">
          <Image
            src={urlFor(value).width(800).height(450).url()}
            alt={value.alt || 'Article image'}
            width={800}
            height={450}
            className="rounded-lg"
          />
          {value.alt && (
            <p className="text-sm text-foreground/60 mt-2 text-center">{value.alt}</p>
          )}
        </div>
      );
    },
  },
  block: {
    h1: ({ children }) => <h1 className="text-4xl font-bold mt-8 mb-4 text-foreground">{children}</h1>,
    h2: ({ children }) => <h2 className="text-3xl font-semibold mt-6 mb-3 text-foreground">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-semibold mt-5 mb-2 text-foreground">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold mt-4 mb-2 text-foreground">{children}</h4>,
    normal: ({ children }) => <p className="mb-4 text-foreground leading-7">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-foreground/80">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-foreground">{children}</li>,
    number: ({ children }) => <li className="text-foreground">{children}</li>,
  },
  marks: {
    link: ({ value, children }: any) => {
      const target = (value?.href || '').startsWith('http') ? '_blank' : undefined;
      return (
        <a
          href={value?.href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          className="text-primary hover:underline"
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
    ),
  },
};

export function PortableText({ value }: PortableTextProps) {
  if (!value) return null;
  return <PortableTextComponent value={value} components={components} />;
}

