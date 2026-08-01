# Metodologia e modello dei dati

## Obiettivo

L’Atlante descrive come persone, famiglie, enti e organizzazioni sono collegati attraverso partecipazioni societarie e legami familiari pubblicamente documentati. Non calcola automaticamente il controllo indiretto e non sostituisce le catene reali con collegamenti sintetici.

## Unità temporale

Ogni dataset è uno **snapshot completo** identificato da una data ISO, per esempio `2025-12-31`. Tutti i nodi, valori e rapporti contenuti nello snapshot si intendono riferiti a quella data o alla migliore informazione disponibile sufficientemente vicina.

Non si inseriscono intervalli temporali dentro le singole relazioni. Quando cambia la situazione, viene creato un nuovo snapshot annuale.

## Nodi

I nodi appartengono a due categorie:

- `subject`: persona, famiglia, Stato, regione, provincia o comune;
- `organization`: holding, trust, fondazione, cooperativa, società quotata o società privata.

Un soggetto territoriale può possedere un’organizzazione ma non può essere posseduto. Un’organizzazione può sia possedere sia essere posseduta.

Gli ID sono in `snake_case`, descrittivi e stabili tra gli anni. La stessa entità deve mantenere lo stesso ID in ogni snapshot.

## Relazione “possiede”

È direzionale e va dal titolare legale della quota all’entità partecipata. La percentuale deve essere compresa tra 0 e 100.

Ogni passaggio della catena viene registrato separatamente. Esempio:

```text
Ministero dell’Economia → CDP → CDP Equity → Fincantieri
```

Non viene creato un collegamento Ministero dell’Economia → Fincantieri se la partecipazione giuridica passa attraverso CDP e CDP Equity.

La relazione rappresenta una partecipazione dichiarata, non necessariamente il controllo societario. Patti parasociali, diritti di voto maggiorato e altri elementi di governance vanno spiegati nella nota e sostenuti da una fonte.

## Legami familiari

Collegano esclusivamente due persone e richiedono una tipologia dichiarata, come `coniuge`, `figlio`, `genitore` o `fratello`. Non si deducono legami da cognomi, articoli generici o supposizioni.

## Valori

- Persone e famiglie: stima patrimoniale pubblicata da una fonte riconoscibile.
- Società quotate: capitalizzazione di mercato alla data dello snapshot o una data molto vicina.
- Società private e holding: valore indicativo dichiarato nella fonte oppure `null` se non stimabile con sufficiente affidabilità.

Il campo `value_basis` deve spiegare in modo breve che cosa rappresenta il numero. Il valore non misura automaticamente la quota economicamente attribuibile al proprietario.

## Fonti

Ogni nodo e relazione contiene un `source_id`. Ordine di preferenza:

1. bilanci, relazioni di governance e documenti ufficiali dell’emittente;
2. Consob, Registro Imprese e altre autorità pubbliche;
3. comunicati e siti investor relations;
4. fonti giornalistiche economiche affidabili;
5. fonti secondarie, soltanto quando la fonte primaria non è accessibile.

La fonte deve sostenere direttamente il dato a cui è collegata. Una fonte generica sulla famiglia non è sufficiente per una percentuale di partecipazione specifica.

## Posizionamento territoriale

La città assegnata a un gruppo è un’ancora visuale morbida basata sulla sua associazione storica, sede principale o centro operativo più riconoscibile. Non rappresenta la residenza esatta delle persone e non deve essere interpretata come dato anagrafico.

