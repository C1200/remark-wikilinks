import assert from 'assert';
import { unified } from 'unified';
import remark from 'remark-parse';
import { visit } from 'unist-util-visit';
import wikilinks from '../dist/index.esm.js';

describe('wikilinks', () => {
    /** @param {import('..').Options} options */
    const createProcessor = (options = {}) =>
        unified().use(remark).use(wikilinks, options);
    const parse = (processor, string) =>
        processor.runSync(processor.parse(string));

    const failPageResolver = (pageName) => {
        return {
            slug: pageName.replace(/ /g, '_').toLowerCase(),
            exists: false,
        };
    };

    it('produces a blue link', () => {
        const processor = createProcessor();

        const string = '[[Wiki Link]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'wiki_link');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/wiki_link');
            assert.equal(node.data.hChildren[0].value, 'Wiki Link');
        });
    });

    it('produces a red link', () => {
        const processor = createProcessor({
            pageResolver: failPageResolver,
        });

        const string = '[[Wiki Link]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, false);
            assert.equal(node.data.permalink, 'wiki_link');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal new');
            assert.equal(node.data.hProperties.href, '/wiki/wiki_link');
            assert.equal(node.data.hChildren[0].value, 'Wiki Link');
        });
    });

    it('produces an aliased link', () => {
        const processor = createProcessor();

        const string = '[[Wiki Link|Alias]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'wiki_link');
            assert.equal(node.data.alias, 'Alias');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/wiki_link');
            assert.equal(node.data.hChildren[0].value, 'Alias');
        });
    });

    it('produces a link with a segment', () => {
        const processor = createProcessor();

        const string = '[[Wiki Link#segment]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'wiki_link');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/wiki_link#segment');
            assert.equal(node.data.hChildren[0].value, 'Wiki Link');
        });
    });

    it('produces an alias using the pipe trick (brackets)', () => {
        const processor = createProcessor();

        const string = '[[Wiki Link (disambiguation)|]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'wiki_link_(disambiguation)');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/wiki_link_(disambiguation)');
            assert.equal(node.data.hChildren[0].value, 'Wiki Link');
        });
    });

    it('produces an alias using the pipe trick (segment)', () => {
        const processor = createProcessor();

        const string = '[[Wiki Link#segment|]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'wiki_link');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/wiki_link#segment');
            assert.equal(node.data.hChildren[0].value, 'Wiki Link');
        });
    });

    it('produces an alias using the pipe trick (namespace)', () => {
        const processor = createProcessor();

        const string = '[[Namespace:Wiki Link|]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'namespace:wiki_link');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/namespace:wiki_link');
            assert.equal(node.data.hChildren[0].value, 'Wiki Link');
        });
    });

    it('produces an alias using the pipe trick (commas)', () => {
        const processor = createProcessor();

        const string = '[[Wiki, Link|]]';
        const ast = parse(processor, string);

        visit(ast, 'wikiLink', (node) => {
            assert.equal(node.data.exists, true);
            assert.equal(node.data.permalink, 'wiki,_link');
            assert.equal(node.data.hName, 'a');
            assert.equal(node.data.hProperties.className, 'internal');
            assert.equal(node.data.hProperties.href, '/wiki/wiki,_link');
            assert.equal(node.data.hChildren[0].value, 'Wiki');
        });
    });

    context('options', () => {
        it('wikiLinkClassName', () => {
            const processor = createProcessor({
                wikiLinkClassName: 'wikilink',
            });

            const string = '[[Wiki Link]]';
            const ast = parse(processor, string);

            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.hProperties.className, 'wikilink');
            });
        });

        it('newClassName', () => {
            const processor = createProcessor({
                newClassName: 'redlink',
                pageResolver: failPageResolver,
            });

            const string = '[[Wiki Link]]';
            const ast = parse(processor, string);

            visit(ast, 'wikiLink', (node) => {
                assert.equal(
                    node.data.hProperties.className,
                    'internal redlink'
                );
            });
        });

        it('pageResolver', () => {
            const processor = createProcessor({
                pageResolver: (pageName) => {
                    return {
                        slug: pageName.replace(/['"$%/\\+?# ]/g, ''),
                        exists: true,
                    };
                },
            });

            const string = '[[Wiki Link]]';
            const ast = parse(processor, string);

            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.exists, true);
                assert.equal(node.data.permalink, 'WikiLink');
                assert.equal(node.data.hName, 'a');
                assert.equal(node.data.hProperties.className, 'internal');
                assert.equal(node.data.hProperties.href, '/wiki/WikiLink');
                assert.equal(node.data.hChildren[0].value, 'Wiki Link');
            });
        });

        it('hrefTemplate', () => {
            const processor = createProcessor({
                hrefTemplate: (slug, segment) => {
                    return `/page/${slug}${segment ? '#' + segment : ''}`;
                }
            });

            const string = '[[Wiki Link]]';
            const ast = parse(processor, string);

            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.hProperties.href, '/page/wiki_link');
            });
        });

        it('aliasDivider (1 character)', () => {
            const processor = createProcessor({
                aliasDivider: '.',
            });
    
            const string = '[[Wiki Link.Alias]]';
            const ast = parse(processor, string);
    
            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.exists, true);
                assert.equal(node.data.permalink, 'wiki_link');
                assert.equal(node.data.alias, 'Alias');
                assert.equal(node.data.hName, 'a');
                assert.equal(node.data.hProperties.className, 'internal');
                assert.equal(node.data.hProperties.href, '/wiki/wiki_link');
                assert.equal(node.data.hChildren[0].value, 'Alias');
            });
        });
    
        it('aliasDivider (2 character)', () => {
            const processor = createProcessor({
                aliasDivider: '::',
            });
    
            const string = '[[Wiki Link::Alias]]';
            const ast = parse(processor, string);
    
            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.exists, true);
                assert.equal(node.data.permalink, 'wiki_link');
                assert.equal(node.data.alias, 'Alias');
                assert.equal(node.data.hName, 'a');
                assert.equal(node.data.hProperties.className, 'internal');
                assert.equal(node.data.hProperties.href, '/wiki/wiki_link');
                assert.equal(node.data.hChildren[0].value, 'Alias');
            });
        });

        it('segmentCharacter (1 character)', () => {
            const processor = createProcessor({
                segmentCharacter: '>',
            });
    
            const string = '[[Wiki Link>alias]]';
            const ast = parse(processor, string);
    
            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.hProperties.href, '/wiki/wiki_link#alias');
            });
        });

        it('segmentCharacter (2 character)', () => {
            const processor = createProcessor({
                segmentCharacter: '->',
            });
    
            const string = '[[Wiki Link->alias]]';
            const ast = parse(processor, string);
    
            visit(ast, 'wikiLink', (node) => {
                assert.equal(node.data.hProperties.href, '/wiki/wiki_link#alias');
            });
        });
    });
});
