import test from 'ava';
import { sourceFilesystem } from '@flatbread/source-filesystem';
import { transformMarkdown } from '@flatbread/transformer-markdown';
import { FlatbreadProvider } from '../base';

function basicProject() {
  return new FlatbreadProvider({
    source: sourceFilesystem(),
    transformer: transformMarkdown({
      markdown: {
        gfm: true,
        externalLinks: true,
      },
    }),

    content: [
      {
        path: 'examples/content/markdown/authors',
        collection: 'Author',
        refs: {
          friend: 'Author',
        },
      },
    ],
  });
}

test('basic query', async (t) => {
  const flatbread = basicProject();

  const result = await flatbread.query({
    source: `
    query AllAuthors {
      allAuthors {
        name
        enjoys
      }
    }
  `,
  });

  t.snapshot(result);
});

test('relational filter query', async (t) => {
  const flatbread = basicProject();

  const result = await flatbread.query({
    source: `
    query AllAuthors {
      allAuthors(filter: {friend: {name: {eq: "Eva"}}}) {
        name
        enjoys
      }
    }
  `,
  });

  t.snapshot(result);
});
