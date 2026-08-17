# Embedding the Atlas in a website or blog

Embed mode displays the same graph and snapshots as the full application but is optimized for article layouts: filters slide in from the side and node details open above the graph.

## HTML snippet

Paste this code into a custom HTML block:

```html
<div style="width:100%;height:min(78vh,760px);min-height:560px;">
  <iframe
    src="https://bctnick.github.io/atlante-capitalismo-italiano/embed.html"
    title="Atlante del Capitalismo Italiano (Atlas of Italian Capitalism)"
    loading="lazy"
    style="width:100%;height:100%;border:0;border-radius:12px;overflow:hidden;"
    allow="fullscreen"
  ></iframe>
</div>
```

To pin a specific snapshot, add the `snapshot` parameter:

```text
https://bctnick.github.io/atlante-capitalismo-italiano/embed.html?snapshot=2025-12-31
```

Without the parameter, the default snapshot in `data/snapshots.json` loads automatically.

## Compatibility

- WordPress: use a **Custom HTML** block.
- Ghost and similar CMSs: use an HTML card or block.
- If the website uses a Content Security Policy, allow `https://bctnick.github.io` in the `frame-src` directive.
- Some hosted publishing platforms remove `iframe` elements. In that case, use a preview image linked to the full Atlas.
