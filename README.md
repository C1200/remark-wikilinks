# remark-wikilinks

A remark plugin that is a replacement for [remark-wiki-link](https://www.npmjs.com/package/remark-wiki-link).

## Installation

npm:
```bash
npm install remark-wikilinks
```
yarn:
```bash
yarn add remark-wikilinks
```

## Usage

```javascript
const unified = require('unified');
const markdown = require('remark-parse');
const wikiLinksPlugin = require('remark-wikilinks');
let processor = unified().use(markdown, { gfm: true }).use(wikiLinksPlugin);
```

When the processor is run, wiki links will be parsed to a `wikiLink` node.

## Configuration

> **Most of the configuration is the same as [remark-wiki-link](https://www.npmjs.com/package/remark-wiki-link).**

-   `options.pageResolver (pageName: string) -> PageResolution`: A function returns a possible permalink and whether or not the page exists.

    The default `pageResolver` is:

```javascript
function pageResolver(pageName) {
    return {
        slug: pageName.replace(/ /g, '_').toLowerCase(),
        exists: true,
    };
}
```

-   `options.hrefTemplate (permalink: string, segment: string) -> string`: A function that maps a permalink and a page segment to some path. This path is used as the `href` for the rendered `a`.

    The default `hrefTemplate` is:

```javascript
function hrefTemplate(permalink, segment) {
    if (segment.length > 0) return `/wiki/${permalink}#${segment}`;
    return `/wiki/${permalink}`;
}
```

-   `options.wikiLinkClassName`: A class name that is attached to any rendered wiki links. Defaults to `"internal"`.
-   `options.newClassName`: A class name that is attached to any rendered wiki links that do not exist. Defaults to `"new"`.
-   `options.aliasDivider`: A string for page aliases. Defaults to `"|"`
-   `options.segmentCharacter`: A string that prefixes the page segment. Defaults to `"#"`.
