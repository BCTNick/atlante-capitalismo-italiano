# Contribuire all’Atlante

Grazie per voler migliorare l’Atlante del Capitalismo Italiano. Sono benvenute correzioni, nuove fonti, nuove catene proprietarie e nuovi snapshot annuali.

## Prima di iniziare

1. Leggi [METHODOLOGY.md](METHODOLOGY.md) e [DISCLAIMER.md](DISCLAIMER.md).
2. Cerca tra issue e pull request aperte per evitare duplicati.
3. Per modifiche ampie, apri prima una issue descrivendo il perimetro.
4. Non inserire dati personali non necessari o informazioni ottenute da fonti private.

## Regole per i dati

- Una pull request dovrebbe riguardare una singola catena societaria, famiglia o correzione coerente.
- Ogni nodo e ogni relazione devono indicare una fonte.
- Preferisci documenti ufficiali e inserisci nella nota la pagina o sezione utile quando il documento è lungo.
- Non creare relazioni sintetiche di proprietà indiretta.
- Non sommare quote o stimare percentuali senza spiegare il calcolo.
- Distingui chiaramente partecipazione, controllo e semplice carica amministrativa.
- Mantieni gli ID esistenti tra gli snapshot.
- Non modificare uno snapshot storico soltanto perché la situazione è cambiata dopo la sua data; crea o aggiorna lo snapshot appropriato.

## Correggere lo snapshot 2025

Modifica:

```text
data/snapshots/2025-12-31/seed.json
```

Poi rigenera e valida:

```bash
python scripts/build_db.py --snapshot 2025-12-31
python scripts/validate_data.py
```

Includi nella pull request sia `seed.json` sia i file generati `graph.json` e `rich_graph.sqlite`.

## Aggiungere un nuovo anno

1. Copia la cartella dello snapshot precedente.
2. Rinominala usando la nuova data ISO, per esempio `2026-12-31`.
3. Aggiorna `meta.snapshot_date` e tutti i dati che sono cambiati.
4. Aggiungi lo snapshot a `data/snapshots.json`.
5. Rigenera e valida tutti gli snapshot.

Ogni nuovo anno deve essere una fotografia completa e verificabile, non un file contenente soltanto le differenze.

## Checklist della pull request

- [ ] Ho indicato la data dello snapshot.
- [ ] Ogni nuovo nodo e relazione ha una fonte raggiungibile.
- [ ] Le percentuali sono comprese tra 0 e 100.
- [ ] Non ho aggiunto scorciatoie per proprietà indirette.
- [ ] Non ho inserito dati personali non necessari.
- [ ] Ho eseguito build e validazione.
- [ ] Accetto che il codice sia distribuito sotto MIT e i contributi ai dati sotto ODbL 1.0.

## Licenza dei contributi

Aprendo una pull request dichiari di avere il diritto di fornire il contributo. Il codice viene distribuito secondo la licenza MIT; modifiche e aggiunte al database secondo ODbL 1.0. Loghi e altri materiali di terzi restano esclusi.

