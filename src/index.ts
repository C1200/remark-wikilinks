import { Plugin } from 'unified';
import { Root } from 'mdast';
import { findAndReplace } from 'mdast-util-find-and-replace';

export interface PageResolution {
    slug: string;
    exists: boolean;
}

export interface Options {
    pageResolver?: (pageName: string) => PageResolution;
    hrefTemplate?: (slug: string, segment: string) => string;
    wikiLinkClassName?: string;
    newClassName?: string;
    aliasDivider?: string;
    segmentCharacter?: string;
    pipeTrickRemove?: RegExp;
}

function buildWikilinkRegex(uncleanS: string, uncleanA: string) {
    const s = uncleanS.replace(escapeRegex, '\\$1');
    const a = uncleanA.replace(escapeRegex, '\\$1');
    return new RegExp(
        `\\[\\[([^${s}${a}\\]]+)(${s}[^${a}\\]]+)?(${a}[^\\]]*)?\\]\\]`,
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
    const aliasDivider = options.aliasDivider || '|';
    const segmentCharacter = options.segmentCharacter || '#';
    const pipeTrickRemove = options.pipeTrickRemove || / *([A-Za-z0-9_-]+:|, [A-Za-z0-9_-]+|\([A-Za-z0-9_-]+\)|#[A-Za-z0-9_-]+) */g;

    const wikilinkRegex = buildWikilinkRegex(segmentCharacter, aliasDivider);

    return function transformer(tree) {
        // @ts-ignore
        findAndReplace(
            tree,
            wikilinkRegex,
            (_, title, rawSegment, rawAlias) => {
                let alias = rawAlias
                    ? rawAlias.substring(aliasDivider.length)
                    : undefined;
                const segment = rawSegment
                    ? rawSegment.substring(segmentCharacter.length)
                    : '';
                const page = pageResolver(title);

                if (alias === '') {
                    alias = title.replace(pipeTrickRemove, '');
                }

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
