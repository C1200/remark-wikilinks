import { Plugin } from 'unified';
import { Root } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';

interface PageResolution {
    slug: string;
    exists: boolean;
}

interface Options {
    pageResolver?: (pageName: string) => PageResolution;
    hrefTemplate?: (slug: string, segment: string) => string;
    /**
     * @default ```internal```
     */
    wikiLinkClassName?: string;
    /**
     * @default ```new```
     */
    newClassName?: string;
    /**
     * @default ```|```
     */
    aliasDivider?: string;
    /**
     * @default ```#```
     */
    segmentCharacter?: string;
}

function buildWikilinkRegex(s: string, a: string) {
    return new RegExp(
        `\\[\\[([^${s}${a}\\]]+)(${s}[^${a}\\]]+)?(${a}[^\\]]+)?\\]\\]`,
        'g'
    );
}

const defaultPageResolver: Options['pageResolver'] = function (pageName) {
    return {
        slug: pageName.replace(/ /g, '_').toLowerCase(),
        exists: true,
    };
};

const defaultHrefTemplate: Options['hrefTemplate'] = function (slug, segment) {
    if (segment.length > 0) return `/wiki/${slug}#${segment}`;
    return `/wiki/${slug}`;
};

const escapeRegex = /([()[{*+.$^\\|?])/g;

const plugin: Plugin<[Options], Root> = function wikilinks(options = {}) {
    const pageResolver = options.pageResolver || defaultPageResolver;
    const hrefTemplate = options.hrefTemplate || defaultHrefTemplate;
    const wikiLinkClassName = options.wikiLinkClassName || 'internal';
    const newClassName = options.newClassName || 'new';
    const aliasDivider = (options.aliasDivider || '|').replace(
        escapeRegex,
        '\\$1'
    );
    const segmentCharacter = (options.segmentCharacter || '#').replace(
        escapeRegex,
        '\\$1'
    );

    const wikilinkRegex = buildWikilinkRegex(segmentCharacter, aliasDivider);

    return function transformer(tree) {
        // @ts-ignore
        findAndReplace(
            tree,
            wikilinkRegex,
            (_, title, rawSegment, rawAlias) => {
                const alias = rawAlias
                    ? rawAlias.substring(aliasDivider.length)
                    : undefined;
                const segment = rawSegment
                    ? rawSegment.substring(segmentCharacter.length)
                    : '';
                const page = pageResolver(title);

                return {
                    type: 'wikiLink',
                    value: alias || title,
                    data: {
                        alias: alias,
                        permalink: page.slug,
                        exists: page.exists,
                        hName: 'a',
                        hProperties: {
                            className: [
                                wikiLinkClassName,
                                !page.exists && newClassName,
                            ]
                                .filter((cn) => cn)
                                .join(' '),
                            href: hrefTemplate(page.slug, segment),
                        },
                        hChildren: [
                            {
                                type: 'text',
                                value: alias || title,
                            },
                        ],
                    },
                };
            }
        );
    };
};

export default plugin;
