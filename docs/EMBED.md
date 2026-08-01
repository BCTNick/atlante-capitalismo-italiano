# Incorporare l’Atlante in un sito o blog

La modalità embed mostra lo stesso grafo e gli stessi snapshot dell’applicazione completa, ma è ottimizzata per lo spazio di un articolo: i filtri sono a scomparsa e il dettaglio del nodo si apre sopra il grafo.

## Codice da incollare

Sostituisci `TUO-USERNAME` con il tuo nome utente GitHub e incolla questo codice in un blocco HTML personalizzato del blog:

```html
<div style="width:100%;height:min(78vh,760px);min-height:560px;">
  <iframe
    src="https://TUO-USERNAME.github.io/atlante-capitalismo-italiano/embed.html"
    title="Atlante del Capitalismo Italiano"
    loading="lazy"
    style="width:100%;height:100%;border:0;border-radius:12px;overflow:hidden;"
    allow="fullscreen"
  ></iframe>
</div>
```

Per fissare uno snapshot specifico, aggiungi il parametro `snapshot`:

```text
https://TUO-USERNAME.github.io/atlante-capitalismo-italiano/embed.html?snapshot=2025-12-31
```

Senza il parametro viene caricato automaticamente lo snapshot predefinito indicato in `data/snapshots.json`.

## Compatibilità

- WordPress: usa un blocco **HTML personalizzato**.
- Ghost e CMS analoghi: usa una card o un blocco HTML.
- Se il sito applica una Content Security Policy, il dominio `https://TUO-USERNAME.github.io` deve essere consentito nella direttiva `frame-src`.
- Alcune piattaforme editoriali ospitate rimuovono gli `iframe`; in quel caso inserisci un’immagine di anteprima collegata all’Atlante completo.

La pagina incorporata contiene anche il comando **Apri atlante ↗**, così il lettore può passare alla visualizzazione completa in una nuova scheda.
