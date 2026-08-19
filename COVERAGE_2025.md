# 2025 coverage register

This file states exactly what “EUR 1 billion coverage” means in the 31 December 2025 snapshot and records deliberate aggregations and omissions.

## Threshold and reference dates

- Wealth universe: Forbes Italy's 16 December 2025 ranking, with estimates dated 12 December 2025.
- Conversion: ECB reference rate on 12 December 2025, EUR 1 = USD 1.1731.
- Wealth cutoff: USD 1.1731 billion. Forbes entries at USD 1.2 billion qualify; entries at USD 1.1 billion do not.
- Listed-company universe: companies classified as Italian by CompaniesMarketCap with end-of-2025 market capitalization of at least EUR 1 billion.

The graph has 352 nodes and 288 relationships backed by 214 source records. It covers all 71 qualifying Forbes wealth entries and all 83 qualifying listed companies in the provider-defined Italian universe. Private-company coverage is intentionally relationship-driven rather than claimed as exhaustive, because private valuations are neither continuously observable nor collected in a complete public register.

## Wealth-entry mapping

The number in the last column is the number of qualifying Forbes entries represented by the Atlas node or nodes.

| Forbes entry or family set | Atlas representation | Treatment | Entries |
|---|---|---|---:|
| Giovanni Ferrero | `giovanni_ferrero` | Individual | 1 |
| Andrea Pignataro | `andrea_pignataro` | Individual | 1 |
| Giancarlo Devasini | `giancarlo_devasini` | Individual | 1 |
| Francesco Gaetano Caltagirone | `caltagirone_family` | Existing family-chain node | 1 |
| Paolo Ardoino | `paolo_ardoino` | Individual | 1 |
| Massimiliana Landini Aleotti | `aleotti_family` | Existing family-chain node | 1 |
| Piero Ferrari and family | `piero_ferrari` | Individual | 1 |
| Eight Del Vecchio heirs | Eight individual heir nodes | Equal Delfin stakes retained | 8 |
| Crippa family | `crippa_family` | Existing family-chain node | 1 |
| Paolo and Gianfelice Rocca | `rocca_family` | Aggregated common Techint wealth network | 2 |
| Giuseppe De' Longhi and family | `delonghi_family` | Existing family-chain node | 1 |
| Sergio Stevanato | `sergio_stevanato` | Individual | 1 |
| Miuccia Prada and Patrizio Bertelli | Two individual nodes | Separate legal holding chains retained | 2 |
| Renzo Rosso and family | `renzo_rosso_family` | Family aggregate | 1 |
| Brunello Cucinelli and family | `brunello_cucinelli_person` | Family aggregate; trust is separate | 1 |
| Remo Ruffini | `remo_ruffini` | Individual | 1 |
| Giuliana, Luciano, Sabrina and Barbara Benetton | `benetton_family` | Aggregated common Edizione chain | 4 |
| Isabella Seragnoli | `isabella_seragnoli` | Individual | 1 |
| Giorgio and Augusto Perfetti | `perfetti_family` | Aggregated jointly owned company | 2 |
| Fabrizio Di Amato | `fabrizio_di_amato` | Individual | 1 |
| Domenico Dolce and Stefano Gabbana | Two individual nodes | Separate equal holding stakes | 2 |
| Ugo Gussalli Beretta and family | `beretta_family` | Family aggregate | 1 |
| Five Berlusconi heirs | `berlusconi_family` | Aggregated common Fininvest chain | 5 |
| Luca and Alessandra Garavoglia | `garavoglia_family` | Aggregated common Lagfin chain | 2 |
| John Elkann | `agnelli_descendants` | Existing ultimate-family node | 1 |
| Pantaleo Dell'Orco | `pantaleo_dellorco` | Individual | 1 |
| Lina Tombolato, Annalisa Doris and Massimo Doris | `doris_family` | Aggregated common Fin.Prog chain | 3 |
| Alberto Bombassei | `bombassei_family` | Existing family-chain node | 1 |
| Maria Franca Fissolo | `maria_franca_fissolo` | Individual | 1 |
| Gustavo Denegri and family | `denegri_family` | Family aggregate | 1 |
| Romano Minozzi | `romano_minozzi` | Individual | 1 |
| Nerio Alessandri | `nerio_alessandri` | Individual | 1 |
| Manfredi Lefebvre d'Ovidio and family | `lefebvre_family` | Family aggregate; trust is separate | 1 |
| Alberto and Marina Prada | Two individual nodes | Separate Bellatrix vehicles | 2 |
| Nicola and Paolo Bulgari | Two individual nodes | No stale post-sale percentage drawn | 2 |
| Massimo Moratti | `massimo_moratti` | No obsolete Saras edge after completed sale | 1 |
| Sandro Veronesi and family | `sandro_veronesi_family` | Named legal owner; wealth estimate includes family | 1 |
| Giovanni Arvedi | `giovanni_arvedi` | Individual | 1 |
| Filippo Ghirelli | `filippo_ghirelli` | Individual | 1 |
| Diego Della Valle | `diego_della_valle` | Individual | 1 |
| Susan Carol Holland | `holland_family` | Existing family-chain node | 1 |
| Mario Moretti Polegato and family | `mario_moretti_polegato` | Named legal holder; wealth estimate includes family | 1 |
| Alessandro Rosano | `alessandro_rosano` | No obsolete HeyDude edge after completed sale | 1 |
| Antonio Percassi | `percassi_family` | Family aggregate | 1 |
| Simona Giorgetta | `simona_giorgetta` | Individual | 1 |
| Giuliana and Marina Caprotti | `caprotti_family` | Aggregated joint Esselunga ownership | 2 |
| Danilo Iervolino | `danilo_iervolino` | No obsolete Multiversity edge after completed sale | 1 |
| **Total** |  |  | **71** |

## Listed companies

There are 83 companies at or above the threshold. Twenty-nine were already represented by an existing ownership chain or were added with the wealth expansion; 54 additional nodes were introduced for the listed-market coverage. Research based primarily on 2025 annual reports, governance reports and official shareholder disclosures has added direct ownership relationships for 48 of those 54 companies.

Six listed companies remain deliberately without an ownership edge: Prysmian, FinecoBank, Hera, Lottomatica, Azimut Holding and BFF Bank. They remain fully visible. In these cases the official evidence describes a dispersed shareholder base, an institutional or employee pool rather than a legal controlling owner, or no family/state controller suitable for this Atlas. A missing edge must not be read as evidence that the company has no shareholders.

Every added market node links to its own historical market-cap page. Existing nodes keep their primary issuer, governance or annual-report source when that source provides a closer or more authoritative snapshot value.

## Known limitations

- Wealth estimates are estimates, not audited personal balance sheets.
- Family aggregates can include only the Forbes-ranked members above the cutoff; they are not a full family genealogy.
- A capital percentage is not automatically the same as voting control.
- Private-company values are often unavailable and therefore remain `null`.
- Companies not classified as Italian by the listed-company source can still appear when they are necessary in an Italian ownership chain, for example Tenaris or EssilorLuxottica.
- Corrections and primary-source upgrades are welcome through pull requests.
