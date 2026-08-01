# Atlante del Capitalismo Italiano

Una visualizzazione open-data delle relazioni di partecipazione tra persone, famiglie, enti pubblici, holding e società italiane.

L’Atlante rappresenta catene societarie esplicite: se una persona possiede una quota di una holding che possiede un’azienda, vengono mostrate entrambe le relazioni, senza creare scorciatoie tra la persona e l’azienda finale. La dimensione dei nodi può riflettere il patrimonio stimato delle persone o il valore delle società.

## Demo locale

Richiede Python 3.11 o successivo.

```bash
python scripts/build_db.py
python serve.py
```

Apri <http://127.0.0.1:8000/app/>.

## Snapshot disponibili

| Data | Stato | Nodi | Relazioni |
|---|---|---:|---:|
| 31 dicembre 2025 | pubblicato | 107 | 97 |

Gli snapshot sono fotografie autonome, non aggiornamenti incrementali. Gli ID dei soggetti rimangono stabili tra gli anni; quote, valori, relazioni e fonti appartengono invece allo specifico snapshot.

```text
data/
├── snapshots.json
└── snapshots/
    └── 2025-12-31/
        ├── seed.json
        ├── graph.json
        └── rich_graph.sqlite
```

- `seed.json` è il file sorgente da modificare tramite pull request.
- `graph.json` alimenta l’applicazione web.
- `rich_graph.sqlite` rende lo snapshot interrogabile anche come database relazionale.
- `snapshots.json` è l’indice degli anni disponibili.

## Contribuire

Correzioni documentate, nuove società e nuovi snapshot sono benvenuti. Prima di aprire una pull request leggi [CONTRIBUTING.md](CONTRIBUTING.md) e [METHODOLOGY.md](METHODOLOGY.md).

Principio fondamentale: **ogni nodo e ogni relazione devono avere una fonte verificabile**. Sono preferite fonti primarie quali bilanci, relazioni di corporate governance, comunicazioni ufficiali, documenti Consob e siti investor relations.

Per controllare localmente una modifica:

```bash
python scripts/build_db.py
python scripts/validate_data.py
```

## Accuratezza e AI

La raccolta iniziale è stata realizzata con il supporto di OpenAI Codex e verificata con criterio best-effort sulle fonti pubbliche indicate. Il progetto può contenere errori, omissioni o interpretazioni inesatte. Leggi il [disclaimer completo](DISCLAIMER.md).

## Licenze

- Codice: [MIT](LICENSE).
- Database originale e contributi ai dati: [Open Database License 1.0](LICENSE-DATA.md).
- Loghi, nomi e marchi appartengono ai rispettivi titolari, sono esclusi dalle licenze del progetto e vengono usati esclusivamente a scopo identificativo. Vedi [TRADEMARKS.md](TRADEMARKS.md).

## Documentazione

- [Metodologia e modello dei dati](METHODOLOGY.md)
- [Linee guida per contribuire](CONTRIBUTING.md)
- [Governance](GOVERNANCE.md)
- [Disclaimer](DISCLAIMER.md)
- [Sicurezza](SECURITY.md)

