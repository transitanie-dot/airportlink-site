#!/usr/bin/env node
/**
 * seo/build-routes.js
 * ---------------------------------------------------------------
 * Gera as páginas de rota e de aeroporto a partir dos ficheiros
 * routes-XX.json, e reescreve o sitemap.
 *
 * Como correr, a partir da raiz do projeto do site:
 *
 *     node seo/build-routes.js
 *
 * Não apaga nada que não tenha gerado. Correr duas vezes dá o mesmo
 * resultado — podes correr sempre que mudares um ficheiro de dados.
 *
 * ---------------------------------------------------------------
 * PORQUÊ FICHEIROS E NÃO PÁGINAS DINÂMICAS
 *
 * O site é estático no Render. Uma página gerada no browser não é
 * lida pelo Google da mesma forma que um ficheiro HTML — e para SEO
 * a diferença ainda importa. Ficheiros reais, servidos direto.
 * ---------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SEO_DIR = path.join(ROOT, 'seo');
// Na RAIZ, com uma subpasta por país.
//
// Estiveram dentro de seo/ e o endereço público dependia de uma
// regra de reescrita no Render. A regra nunca funcionou de forma
// fiável, e uma página que só abre se uma configuração estiver
// certa é uma página que um dia deixa de abrir.
//
// Aqui o caminho do ficheiro É o endereço:
//   transfers/portugal/faro-to-albufeira.html
//   /transfers/portugal/faro-to-albufeira.html
//
// Não é preciso regra nenhuma. A pasta seo/ fica com o gerador e os
// dados, que é para o que serve.
const OUT_TRANSFERS = path.join(ROOT, 'transfers');
const OUT_AIRPORTS = path.join(ROOT, 'airports');
const SITE = 'https://www.airportlink.app';

/**
 * As línguas que ganham páginas próprias e indexáveis.
 *
 * NÃO são as dezoito do site. Uma página só vale a pena indexar se
 * o conteúdo estiver realmente traduzido; caso contrário o Google
 * trata o conjunto como texto gerado em massa e desvaloriza também
 * a versão inglesa.
 *
 * O inglês é a base e vive na raiz. As outras vivem em /es/, /de/
 * e /fr/, e só são geradas para as rotas que tiverem tradução.
 */
const LANGS = [
  { code: 'en', prefix: '',     nome: 'English'    },
  { code: 'es', prefix: '/es',  nome: 'Espanol'    },
  { code: 'pt', prefix: '/pt',  nome: 'Portugues'  },
  { code: 'de', prefix: '/de',  nome: 'Deutsch'    },
  { code: 'fr', prefix: '/fr',  nome: 'Francais'   }
];

/**
 * As frases do modelo, nas línguas indexáveis.
 *
 * Separadas do conteúdo das rotas de propósito: estas repetem-se
 * em todas as páginas e traduzem-se uma vez; o texto de cada rota
 * é único e vive no JSON do país.
 *
 * O inglês não está aqui — é o que está escrito no código, e serve
 * de rede quando falta uma chave.
 */
const T9N = {
  pt: {
    "Home": "Início",
    "Van": "Carrinha",
    "Minibus": "Miniautocarro",
    "Coach": "Autocarro",
    "Up to 8 passengers with a suitcase each.": "Até 8 passageiros com uma mala cada.",
    "Continue &rarr;": "Continuar →",
    "Hotel, address or town": "Hotel, morada ou localidade",
    "Airport, hotel or address": "Aeroporto, hotel ou morada",
    "Where to?": "Para onde?",
    "A private vehicle": "Uma viatura privada",
    "for your group. No sharing, no other stops.": "para o seu grupo. Sem partilha e sem outras paragens.",
    "A fixed price": "Um preço fixo",
    "with tolls and taxes in. Nothing is added at the end.": "com portagens e impostos incluídos. Nada é acrescentado no fim.",
    "Flight tracking.": "Seguimento do voo.",
    "Land late and the pick-up moves, not the price.": "Se aterrar tarde, muda a hora da recolha, não o preço.",
    "60 minutes of free waiting": "60 minutos de espera gratuita",
    "after the flight lands.": "depois de o voo aterrar.",
    "until 24 hours before pick-up.": "até 24 horas antes da recolha.",
    "One suitcase and one bag per passenger.": "Uma mala e um saco por passageiro.",
    "More than that, tell us when you book.": "Se levar mais, diga-nos ao reservar.",
    "from": "desde",
    "Date": "Data",
    "passenger": "passageiro",
    "Pick-up": "Recolha",
    "Drop-off": "Destino",
    "Pick-up time": "Hora de recolha",
    "Passengers": "Passageiros",
    "Sedan": "Carro",
    "Up to 4 passengers with hand luggage.": "Até 4 passageiros com bagagem de mão.",
    "Whole car &middot; tolls and taxes in": "Carro completo · portagens e impostos incluídos",
    "Book now, pay later": "Reserve agora, pague depois",
    "payOn": "Reserve agora, pague a {data}",
    "Continue &rarr;": "Continuar →",
    "passengers": "passageiros",
    "mins": "min",
    "Free cancellation": "Cancelamento gratuito",
    "Until 24 hours before, refunded in full": "Até 24 horas antes, com reembolso total",
    "No card today": "Hoje não se cobra o cartão",
    "Charged 48 hours before you travel": "Cobrado 48 horas antes de viajar",
    "Flight tracked": "Voo seguido",
    "Land late and the driver waits, free": "Se aterrar tarde, o motorista espera, sem custo",
    "Licensed drivers": "Motoristas licenciados",
    "Insurance and licence checked by us": "Seguro e licença verificados por nós",
    "mapsSays": "O mapa diz {min} minutos. Isso é a condução. De porta a porta desde o momento em que aterra é outro número, e é esse que vale a pena planear.",
    "Taxi and disembark": "Taxiar e desembarcar",
    "Passport control": "Controlo de passaportes",
    "None inside Schengen. 15&ndash;45 min from outside it.": "Nenhum dentro de Schengen. 15 a 45 min vindo de fora.",
    "Baggage reclaim": "Recolha de bagagem",
    "10&ndash;25 min with hold luggage": "10 a 25 min com bagagem de porão",
    "Finding your driver": "Encontrar o motorista",
    "2&ndash;5 min. Your name on a sign.": "2 a 5 min. O seu nome numa placa.",
    "The drive": "A viagem",
    "10&ndash;15 min": "10 a 15 min",
    "realistically": "Realisticamente, {min1} a {min2} minutos depois de aterrar.",
    "ifWaiting": "Se alguém estiver à sua espera, é este o número a dar.",
    "bookEarly": "Reservar cedo custa o mesmo que reservar tarde — o preço não muda. O que muda é se ainda há carro.",
    "A week ahead": "Uma semana antes",
    "busyArrivals": "Julho, agosto, sextas e sábados. As chegadas mais movimentadas do ano{extra}.",
    "longRun": ", e um percurso longo como este é o primeiro a esgotar",
    "As soon as you have the flight": "Assim que tiver o voo",
    "Groups of five or more. Vans and minibuses go first, always.": "Grupos de cinco ou mais. As carrinhas esgotam sempre primeiro.",
    "Two or three days": "Dois ou três dias",
    "Landing between 23:00 and 06:00. Fewer drivers are working.": "Aterragens entre as 23:00 e as 06:00. Há menos motoristas a trabalhar.",
    "The day before is fine": "A véspera chega",
    "Everything else. The same morning usually works too.": "Tudo o resto. Na própria manhã costuma também dar.",
    "cancelFree": "O cancelamento é gratuito até 24 horas antes, por isso reservar cedo não lhe custa nada se os planos mudarem.",
    "aHowLong": "Cerca de {min} minutos para os {km} km, fora das horas de ponta. O motorista conhece o caminho e segue o voo, por isso uma aterragem atrasada muda a hora da recolha em vez de lhe custar a viagem.",
    "aHowMuch": "Desde {p1} para até quatro passageiros, e {p5} para um grupo de cinco a oito numa carrinha. O preço fica fixo quando reserva — portagens e impostos incluídos, nada acrescentado no fim.",
    "aFlightLate": "Seguimos o número de voo que nos der. O motorista espera e ajusta-se à hora real da aterragem, com 60 minutos de espera gratuita depois de o avião tocar no solo.",
    "aWhereMeet": "Na sala de chegadas, depois da alfândega. Na véspera enviamos-lhe o nome do motorista, o telefone e a viatura, e ele contacta-o com o ponto exato.",
    "aCancel": "Gratuito até 24 horas antes da recolha, com reembolso total e automático. Em muitas rotas pode também reservar sem pagar, e só cobramos o cartão 48 horas antes.",
    "allTransfers": "Todos os transfers do aeroporto de {cidade} ›",
    "See prices &rarr;": "Ver preços →",
    "From": "Desde",
    "otherAirports": "Outros aeroportos em {pais}",
    "What is included": "O que está incluído",
    "h1Route": "{cidade} para {destino}",
    "descRoute": "Transfer privado de {aeroporto} para {destino}: {min} minutos, {km} km, desde {preco} para até 4 pessoas. Preço fixo, voo seguido, cancelamento gratuito.",
    "qHowLong": "Quanto tempo demora de {cidade} para {destino}?",
    "qHowMuch": "Quanto custa um transfer de {cidade} para {destino}?",
    "qWhereMeet": "Onde encontro o motorista no aeroporto de {cidade}?",
    "Price your transfer": "Calcule o seu transfer",
    "How long it really takes": "Quanto demora na realidade",
    "When to book": "Quando reservar",
    "Before you land": "Antes de aterrar",
    "FAQ": "Perguntas frequentes",
    "otherFrom": "Outros transfers do aeroporto de {cidade}",
    "arriving": "Chegar a {aeroporto}",
    "h1Airport": "Transfers do {aeroporto}",
    "descAirport": "Transfers privados de {aeroporto} para {n} destinos, desde {preco}. Preços fixos, voo seguido e um motorista à sua espera nas chegadas.",
    'The airport': 'O aeroporto',
    'The journey': 'A viagem',
    'What is included': 'O que está incluído',
    'Where people go': 'Para onde as pessoas vão',
    'Get a price': 'Ver preço',
    'Going somewhere not on this list?': 'Vai para um sítio que não está na lista?',
    'Can I cancel?': 'Posso cancelar?',
    'What happens if my flight is late?': 'E se o meu voo atrasar?',
    'titleRoute': '{cidade} para {destino} | Transfer desde {preco} | Airportlink',
    'titleAirport': 'Transfers do Aeroporto de {cidade} ({iata}) | Desde {preco} | Airportlink'
  },
  es: {
    "Home": "Inicio",
    "Pick-up": "Recogida",
    "Drop-off": "Destino",
    "Pick-up time": "Hora de recogida",
    "Passengers": "Pasajeros",
    "passengers": "pasajeros",
    "passenger": "pasajero",
    "Date": "Fecha",
    "From": "Desde",
    "from": "desde",
    "Sedan": "Coche",
    "Van": "Furgoneta",
    "Minibus": "Microbús",
    "Coach": "Autocar",
    "Up to 4 passengers with hand luggage.": "Hasta 4 pasajeros con equipaje de mano.",
    "Up to 8 passengers with a suitcase each.": "Hasta 8 pasajeros con una maleta cada uno.",
    "Whole car &middot; tolls and taxes in": "Coche completo · peajes e impuestos incluidos",
    "Book now, pay later": "Reserva ahora, paga después",
    "payOn": "Reserva ahora, paga el {data}",
    "Continue &rarr;": "Continuar →",
    "Airport, hotel or address": "Aeropuerto, hotel o dirección",
    "Hotel, address or town": "Hotel, dirección o localidad",
    "Free cancellation": "Cancelación gratuita",
    "Until 24 hours before, refunded in full": "Hasta 24 horas antes, con reembolso íntegro",
    "No card today": "Hoy no se cobra la tarjeta",
    "Charged 48 hours before you travel": "Se cobra 48 horas antes de viajar",
    "Flight tracked": "Vuelo monitorizado",
    "Land late and the driver waits, free": "Si aterrizas tarde, el conductor espera, sin coste",
    "Licensed drivers": "Conductores con licencia",
    "Insurance and licence checked by us": "Seguro y licencia comprobados por nosotros",
    "A private vehicle": "Un vehículo privado",
    "for your group. No sharing, no other stops.": "para tu grupo. Sin compartir y sin otras paradas.",
    "A fixed price": "Un precio fijo",
    "with tolls and taxes in. Nothing is added at the end.": "con peajes e impuestos incluidos. No se añade nada al final.",
    "Flight tracking.": "Seguimiento del vuelo.",
    "Land late and the pick-up moves, not the price.": "Si aterrizas tarde, se mueve la recogida, no el precio.",
    "60 minutes of free waiting": "60 minutos de espera gratuita",
    "after the flight lands.": "tras el aterrizaje del vuelo.",
    "until 24 hours before pick-up.": "hasta 24 horas antes de la recogida.",
    "One suitcase and one bag per passenger.": "Una maleta y un bolso por pasajero.",
    "More than that, tell us when you book.": "Si llevas más, dínoslo al reservar.",
    "mapsSays": "El mapa dice {min} minutos. Eso es la conducción. De puerta a puerta desde que aterrizas es otra cifra, y es la que conviene planificar.",
    "Taxi and disembark": "Rodaje y desembarque",
    "Passport control": "Control de pasaportes",
    "None inside Schengen. 15&ndash;45 min from outside it.": "Ninguno dentro de Schengen. De 15 a 45 min viniendo de fuera.",
    "Baggage reclaim": "Recogida de equipaje",
    "10&ndash;25 min with hold luggage": "De 10 a 25 min con equipaje facturado",
    "Finding your driver": "Encontrar al conductor",
    "2&ndash;5 min. Your name on a sign.": "De 2 a 5 min. Tu nombre en un cartel.",
    "The drive": "El trayecto",
    "10&ndash;15 min": "De 10 a 15 min",
    "realistically": "Siendo realistas, de {min1} a {min2} minutos después de aterrizar.",
    "ifWaiting": "Si alguien te espera, esa es la cifra que hay que darle.",
    "bookEarly": "Reservar pronto cuesta lo mismo que reservar tarde — el precio no se mueve. Lo que se mueve es si queda coche.",
    "A week ahead": "Una semana antes",
    "busyArrivals": "Julio, agosto, viernes y sábados. Las llegadas con más afluencia del año{extra}.",
    "longRun": ", y un trayecto largo como este es el primero en agotarse",
    "As soon as you have the flight": "En cuanto tengas el vuelo",
    "Groups of five or more. Vans and minibuses go first, always.": "Grupos de cinco o más. Las furgonetas se agotan siempre primero.",
    "Two or three days": "Dos o tres días",
    "Landing between 23:00 and 06:00. Fewer drivers are working.": "Aterrizajes entre las 23:00 y las 06:00. Hay menos conductores trabajando.",
    "The day before is fine": "La víspera basta",
    "Everything else. The same morning usually works too.": "Todo lo demás. La misma mañana suele funcionar también.",
    "cancelFree": "La cancelación es gratuita hasta 24 horas antes, así que reservar pronto no te cuesta nada si cambian los planes.",
    "aHowLong": "Unos {min} minutos para los {km} km, fuera de hora punta. El conductor conoce la ruta y sigue el vuelo, así que un aterrizaje con retraso mueve la recogida en lugar de costarte el traslado.",
    "aHowMuch": "Desde {p1} para hasta cuatro pasajeros, y {p5} para un grupo de cinco a ocho en furgoneta. El precio queda fijo al reservar — peajes e impuestos incluidos, sin añadidos al final.",
    "aFlightLate": "Seguimos el número de vuelo que nos des. El conductor espera y se ajusta a la hora real de aterrizaje, con 60 minutos de espera gratuita desde que el avión toca tierra.",
    "aWhereMeet": "En la sala de llegadas, tras pasar la aduana. La víspera te enviamos el nombre del conductor, su teléfono y el vehículo, y él te contacta con el punto exacto.",
    "aCancel": "Gratuita hasta 24 horas antes de la recogida, con reembolso íntegro y automático. En muchas rutas puedes además reservar sin pagar, y solo cobramos la tarjeta 48 horas antes.",
    "allTransfers": "Todos los traslados del aeropuerto de {cidade} ›",
    "See prices &rarr;": "Ver precios →",
    "otherAirports": "Otros aeropuertos en {pais}",
    "h1Route": "{cidade} a {destino}",
    "descRoute": "Traslado privado de {aeroporto} a {destino}: {min} minutos, {km} km, desde {preco} para hasta 4 personas. Precio fijo, vuelo monitorizado, cancelación gratuita.",
    "qHowLong": "¿Cuánto se tarda de {cidade} a {destino}?",
    "qHowMuch": "¿Cuánto cuesta un traslado de {cidade} a {destino}?",
    "qWhereMeet": "¿Dónde encuentro al conductor en el aeropuerto de {cidade}?",
    "Price your transfer": "Calcula tu traslado",
    "How long it really takes": "Cuánto se tarda realmente",
    "When to book": "Cuándo reservar",
    "Before you land": "Antes de aterrizar",
    "FAQ": "Preguntas frecuentes",
    "otherFrom": "Otros traslados del aeropuerto de {cidade}",
    "arriving": "Llegar a {aeroporto}",
    "h1Airport": "Traslados desde {aeroporto}",
    "descAirport": "Traslados privados de {aeroporto} a {n} destinos, desde {preco}. Precios fijos, seguimiento del vuelo y un conductor esperándote en llegadas.",
    'The airport': 'El aeropuerto',
    'The journey': 'El trayecto',
    'What is included': 'Qué incluye',
    'Where people go': 'A dónde va la gente',
    'Get a price': 'Ver precio',
    'Going somewhere not on this list?': '¿Vas a un sitio que no está en la lista?',
    'Can I cancel?': '¿Puedo cancelar?',
    'What happens if my flight is late?': '¿Y si mi vuelo se retrasa?',
    'titleRoute': '{cidade} a {destino} | Traslado desde {preco} | Airportlink',
    'titleAirport': 'Traslados del Aeropuerto de {cidade} ({iata}) | Desde {preco} | Airportlink'
  },
  de: {
    "h1Route": "{cidade} nach {destino}",
    "descRoute": "Privater Transfer von {aeroporto} nach {destino}: {min} Minuten, {km} km, ab {preco} für bis zu 4 Personen. Festpreis, Flugverfolgung, kostenlose Stornierung.",
    "qHowLong": "Wie lange dauert es von {cidade} nach {destino}?",
    "qHowMuch": "Was kostet ein Transfer von {cidade} nach {destino}?",
    "qWhereMeet": "Wo treffe ich den Fahrer am Flughafen {cidade}?",
    "Price your transfer": "Preis berechnen",
    "How long it really takes": "Wie lange es wirklich dauert",
    "When to book": "Wann buchen",
    "Before you land": "Vor der Landung",
    "FAQ": "Häufige Fragen",
    "otherFrom": "Weitere Transfers ab Flughafen {cidade}",
    "arriving": "Ankunft an {aeroporto}",
    "h1Airport": "Transfers ab {aeroporto}",
    "descAirport": "Private Transfers von {aeroporto} zu {n} Zielen, ab {preco}. Festpreise, Flugverfolgung und ein Fahrer, der in der Ankunftshalle wartet.",
    'The airport': 'Der Flughafen',
    'The journey': 'Die Fahrt',
    'What is included': 'Was enthalten ist',
    'Where people go': 'Wohin die Leute fahren',
    'Get a price': 'Preis ansehen',
    'Going somewhere not on this list?': 'Ihr Ziel steht nicht auf der Liste?',
    'Can I cancel?': 'Kann ich stornieren?',
    'What happens if my flight is late?': 'Was, wenn mein Flug Verspätung hat?',
    'titleRoute': '{cidade} nach {destino} | Transfer ab {preco} | Airportlink',
    'titleAirport': 'Flughafentransfers {cidade} ({iata}) | Ab {preco} | Airportlink'
  },
  fr: {
    "Home": "Accueil",
    "Pick-up": "Prise en charge",
    "Drop-off": "Destination",
    "Pick-up time": "Heure de prise en charge",
    "Passengers": "Passagers",
    "passengers": "passagers",
    "passenger": "passager",
    "Date": "Date",
    "From": "Dès",
    "from": "dès",
    "Sedan": "Voiture",
    "Van": "Van",
    "Minibus": "Minibus",
    "Coach": "Autocar",
    "Up to 4 passengers with hand luggage.": "Jusqu'à 4 passagers avec bagage à main.",
    "Up to 8 passengers with a suitcase each.": "Jusqu'à 8 passagers avec une valise chacun.",
    "Whole car &middot; tolls and taxes in": "Voiture entière · péages et taxes compris",
    "Book now, pay later": "Réservez maintenant, payez plus tard",
    "payOn": "Réservez maintenant, payez le {data}",
    "Continue &rarr;": "Continuer →",
    "Airport, hotel or address": "Aéroport, hôtel ou adresse",
    "Hotel, address or town": "Hôtel, adresse ou ville",
    "Free cancellation": "Annulation gratuite",
    "Until 24 hours before, refunded in full": "Jusqu'à 24 heures avant, remboursement intégral",
    "No card today": "Rien n'est débité aujourd'hui",
    "Charged 48 hours before you travel": "Débité 48 heures avant votre départ",
    "Flight tracked": "Vol suivi",
    "Land late and the driver waits, free": "En cas de retard, le chauffeur attend, sans supplément",
    "Licensed drivers": "Chauffeurs agréés",
    "Insurance and licence checked by us": "Assurance et licence vérifiées par nos soins",
    "A private vehicle": "Un véhicule privé",
    "for your group. No sharing, no other stops.": "pour votre groupe. Sans partage et sans autre arrêt.",
    "A fixed price": "Un prix fixe",
    "with tolls and taxes in. Nothing is added at the end.": "péages et taxes compris. Rien n'est ajouté à la fin.",
    "Flight tracking.": "Suivi du vol.",
    "Land late and the pick-up moves, not the price.": "En cas de retard, c'est la prise en charge qui bouge, pas le prix.",
    "60 minutes of free waiting": "60 minutes d'attente offertes",
    "after the flight lands.": "après l'atterrissage.",
    "until 24 hours before pick-up.": "jusqu'à 24 heures avant la prise en charge.",
    "One suitcase and one bag per passenger.": "Une valise et un bagage à main par passager.",
    "More than that, tell us when you book.": "Au-delà, dites-le nous à la réservation.",
    "mapsSays": "La carte indique {min} minutes. C'est le temps de route. De porte à porte à partir de l'atterrissage, c'est un autre chiffre, et c'est celui qu'il faut prévoir.",
    "Taxi and disembark": "Roulage et débarquement",
    "Passport control": "Contrôle des passeports",
    "None inside Schengen. 15&ndash;45 min from outside it.": "Aucun à l'intérieur de Schengen. De 15 à 45 min en venant de l'extérieur.",
    "Baggage reclaim": "Récupération des bagages",
    "10&ndash;25 min with hold luggage": "De 10 à 25 min avec bagage en soute",
    "Finding your driver": "Retrouver le chauffeur",
    "2&ndash;5 min. Your name on a sign.": "De 2 à 5 min. Votre nom sur une pancarte.",
    "The drive": "Le trajet",
    "10&ndash;15 min": "De 10 à 15 min",
    "realistically": "Réalistement, de {min1} à {min2} minutes après l'atterrissage.",
    "ifWaiting": "Si quelqu'un vous attend, c'est ce chiffre qu'il faut lui donner.",
    "bookEarly": "Réserver tôt coûte la même chose que réserver tard — le prix ne bouge pas. Ce qui bouge, c'est de savoir s'il reste une voiture.",
    "A week ahead": "Une semaine à l'avance",
    "busyArrivals": "Juillet, août, vendredis et samedis. Les arrivées les plus chargées de l'année{extra}.",
    "longRun": ", et un long trajet comme celui-ci est le premier à manquer",
    "As soon as you have the flight": "Dès que vous avez le vol",
    "Groups of five or more. Vans and minibuses go first, always.": "Groupes de cinq personnes ou plus. Les vans partent toujours en premier.",
    "Two or three days": "Deux ou trois jours",
    "Landing between 23:00 and 06:00. Fewer drivers are working.": "Atterrissage entre 23h00 et 06h00. Il y a moins de chauffeurs en service.",
    "The day before is fine": "La veille suffit",
    "Everything else. The same morning usually works too.": "Tout le reste. Le matin même fonctionne aussi la plupart du temps.",
    "cancelFree": "L'annulation est gratuite jusqu'à 24 heures avant, donc réserver tôt ne vous coûte rien si les plans changent.",
    "aHowLong": "Environ {min} minutes pour les {km} km, hors heures de pointe. Le chauffeur connaît la route et suit le vol : un atterrissage retardé décale la prise en charge au lieu de vous coûter le transfert.",
    "aHowMuch": "Dès {p1} pour quatre passagers maximum, et {p5} pour un groupe de cinq à huit en van. Le prix est fixé à la réservation — péages et taxes compris, rien n'est ajouté à la fin.",
    "aFlightLate": "Nous suivons le numéro de vol que vous nous donnez. Le chauffeur attend et s'adapte à l'heure réelle d'atterrissage, avec 60 minutes d'attente offertes après que l'avion a touché le sol.",
    "aWhereMeet": "Dans le hall des arrivées, après la douane. La veille de votre voyage nous vous envoyons le nom du chauffeur, son téléphone et le véhicule, et il vous contacte avec le point de rendez-vous exact.",
    "aCancel": "Gratuite jusqu'à 24 heures avant la prise en charge, remboursée intégralement et automatiquement. Sur de nombreux trajets vous pouvez aussi réserver sans payer, et nous ne débitons la carte que 48 heures avant.",
    "allTransfers": "Tous les transferts de l'aéroport de {cidade} ›",
    "See prices &rarr;": "Voir les prix →",
    "otherAirports": "Autres aéroports en {pais}",
    "h1Route": "{cidade} vers {destino}",
    "descRoute": "Transfert privé de {aeroporto} vers {destino} : {min} minutes, {km} km, dès {preco} pour 4 personnes maximum. Prix fixe, vol suivi, annulation gratuite.",
    "qHowLong": "Combien de temps faut-il de {cidade} vers {destino} ?",
    "qHowMuch": "Combien coûte un transfert de {cidade} vers {destino} ?",
    "qWhereMeet": "Où retrouver le chauffeur à l'aéroport de {cidade} ?",
    "Price your transfer": "Calculez votre transfert",
    "How long it really takes": "La durée réelle du trajet",
    "When to book": "Quand réserver",
    "Before you land": "Avant d'atterrir",
    "FAQ": "Questions fréquentes",
    "otherFrom": "Autres transferts depuis l'aéroport de {cidade}",
    "arriving": "Arriver à {aeroporto}",
    "h1Airport": "Transferts depuis {aeroporto}",
    "descAirport": "Transferts privés de {aeroporto} vers {n} destinations, dès {preco}. Prix fixes, suivi du vol et un chauffeur qui attend à l'arrivée.",
    'The airport': "L'aéroport",
    'The journey': 'Le trajet',
    'What is included': 'Ce qui est compris',
    'Where people go': 'Où vont les voyageurs',
    'Get a price': 'Voir le prix',
    'Going somewhere not on this list?': "Votre destination n'est pas dans la liste ?",
    'Can I cancel?': 'Puis-je annuler ?',
    'What happens if my flight is late?': 'Et si mon vol est retardé ?',
    'titleRoute': '{cidade} vers {destino} | Transfert dès {preco} | Airportlink',
    'titleAirport': "Transferts aéroport de {cidade} ({iata}) | Dès {preco} | Airportlink"
  }
};

/**
 * O nome do país na língua da página.
 *
 * O slug do endereço fica sempre em inglês — mudá-lo partiria as
 * ligações e obrigaria a redireccionamentos. O que muda é só o
 * nome que a pessoa lê.
 */
function pais(country, lang) {
  return (country.countryI18n && country.countryI18n[lang]) || country.country;
}

/** Uma frase do modelo, com o inglês como rede. */
function t9n(lang, en) {
  return (T9N[lang] && T9N[lang][en]) || en;
}

/**
 * Uma frase com marcadores preenchidos.
 *
 * Devolve null se a língua não tiver a chave, para quem chama usar
 * o inglês que está escrito no código. Os marcadores existem porque
 * a ordem das palavras muda de língua para língua: em alemão o
 * destino vem antes do verbo, e colar pedaços de texto não resolve.
 */
function frase(lang, chave, vars) {
  const t = T9N[lang] && T9N[lang][chave];
  if (!t) return null;
  return Object.keys(vars).reduce(
    (acc, k) => acc.split('{' + k + '}').join(vars[k]), t);
}

/**
 * O texto de uma rota na língua pedida.
 *
 * O JSON guarda o inglês nos campos normais e as traduções num
 * objeto `i18n`. Se a língua não estiver lá, devolve null — e a
 * página nessa língua simplesmente não é gerada, em vez de sair
 * meio traduzida.
 */
function traduz(obj, lang) {
  if (lang === 'en') return obj;
  const t = obj && obj.i18n && obj.i18n[lang];
  return t ? Object.assign({}, obj, t) : null;
}

// A mesma chave que o index.html usa. É pública por natureza — vive
// no browser — e a protecção faz-se no painel do Google, limitando-a
// ao domínio airportlink.app.
const MAPS_KEY = 'AIzaSyBWH1TXxWhFmFo7fMB8NXE4swU2idCc_0M';

/**
 * A mesma fórmula do servidor.
 *
 * Tem de ser a mesma: um preço na página diferente do preço no
 * calculador é a forma mais rápida de perder a confiança de quem
 * chega pelo Google.
 *
 * Se mudares os valores no server.js, muda aqui também.
 */
const PT_ZONES = {
  lisbon: { base: 23.23, perKm: 0.909 },
  porto:  { base: 7.14,  perKm: 1.401 },
  faro:   { base: 4.45,  perKm: 1.116 }
};
const PT_FALLBACK = { base: 11.61, perKm: 1.142 };

/** Espanha: Madrid e Barcelona com tabela própria, o resto usa Málaga. */
const ES_ZONES = {
  madrid:    { base: 39.87, perKm: 1.3316, premium: 1.516,
               van: 1.508, van_sedan: 3.737, two_vans: 4.189 },
  barcelona: { base: 29.04, perKm: 1.3106, premium: 1.426,
               van: 1.455, van_sedan: 3.605, two_vans: 4.041 }
};
const ES_FALLBACK = { base: 39.76, perKm: 1.2843, premium: 1.530,
  van: 1.484, van_sedan: 3.678, two_vans: 4.123 };

/** Rotas com preço combinado. O Sitges custa-lhes o dobro da fórmula. */
const ES_FIXED = { 'sitges': { sedan: 128.56, premium: 175.57 } };

/** A tabela desta página: zona, multiplicadores e preço fixo se houver. */
function zoneFor(cc, zoneSlug, dest) {
  const PT_MULT = { premium: 1.47, van: 1.7, van_sedan: 2.85, two_vans: 3.6 };

  if (cc === 'ES') {
    const z = { ...(ES_ZONES[zoneSlug] || ES_FALLBACK) };
    if (dest && ES_FIXED[dest.slug]) z.fixed = ES_FIXED[dest.slug];
    return z;
  }
  if (cc === 'PT') return { ...(PT_ZONES[zoneSlug] || PT_FALLBACK), ...PT_MULT };
  return null;
}

function priceEUR(km, passengers, countryCode, zoneSlug, destSlug) {
  const cls =
    passengers <= 3 ? 'sedan' :
    passengers <= 4 ? 'premium' :
    passengers <= 8 ? 'van' :
    passengers <= 13 ? 'van_sedan' : 'two_vans';

  // Espanha tem multiplicadores por zona; Portugal um conjunto único.
  if (countryCode === 'ES') {
    const z = ES_ZONES[zoneSlug] || ES_FALLBACK;

    const fixed = ES_FIXED[destSlug];
    if (fixed) {
      if (cls === 'sedan') return fixed.sedan;
      if (cls === 'premium') return fixed.premium;
      return fixed.sedan * z[cls];
    }

    return Math.max(24, (z.base + km * z.perKm) * (cls === 'sedan' ? 1 : z[cls]));
  }

  const m = cls === 'sedan' ? 1 : cls === 'premium' ? 1.47
    : cls === 'van' ? 1.7 : cls === 'van_sedan' ? 2.85 : 3.6;

  if (countryCode === 'PT') {
    const z = PT_ZONES[zoneSlug] || PT_FALLBACK;
    return Math.max(24, (z.base + km * z.perKm) * m);
  }

  return Math.max(25, (20 + km * 3.5) * 1.3 * m);
}

const money = (v) => '€' + Math.round(v);

/**
 * O que aparece no endereço.
 *
 * O nome da cidade, não o código IATA: as pessoas pesquisam
 * "faro airport transfer to albufeira" e não "FAO to albufeira".
 * O endereço bate certo com o que elas escrevem.
 *
 * Se o slug faltar no ficheiro de dados, cai para o nome da cidade
 * sem acentos — mas vale a pena escrevê-lo, para não haver surpresas
 * com cidades de nome composto.
 */
/** O país no endereço: 'Portugal' vira 'portugal'. */
function countrySlug(country) {
  return String(country.country)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugOf(airport) {
  if (airport.slug) return airport.slug;

  return String(airport.city || airport.iata)
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function esc(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const today = new Date().toISOString().slice(0, 10);

// ============================================================
// O MOLDE
// ============================================================

function head({ title, description, canonical, schema, lang, alternates }) {
  lang = lang || 'en';

  // Cada versão declara-se a si própria E a todas as outras. Se a
  // espanhola não apontar de volta para a inglesa, o Google ignora
  // o grupo inteiro e nenhuma delas beneficia.
  const hreflang = (alternates || [])
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${a.url}">`)
    .join('\n');

  const xdefault = (alternates || []).find((a) => a.lang === 'en');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
${hreflang}${xdefault ? `\n<link rel="alternate" hreflang="x-default" href="${xdefault.url}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Airportlink">
<meta property="og:image" content="${SITE}/assets/og-square.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/assets/og-square.jpg">
<meta property="og:type" content="website">
<meta name="theme-color" content="#E8EBE7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1219" media="(prefers-color-scheme: dark)">
<script>
  (function () {
    try {
      var t = localStorage.getItem('airportlink-theme');
      if (t === 'dark' || t === 'light') document.documentElement.setAttribute('data-theme', t);

      // Esta página já está escrita numa língua. Diz-se ao i18n qual
      // é, para o cabeçalho e o rodapé saírem na mesma — senão
      // seguiriam a preferência guardada e a página ficava mista.
      window.__PAGE_LANG = document.documentElement.lang || 'en';
    } catch (e) {}
  })();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/site.css">
<script src="/assets/i18n.js"></script>
<script src="/assets/layout.js" defer></script>
<script type="application/ld+json">
${JSON.stringify(schema, null, 1)}
</script>
<style>
.rt{max-width:820px;margin:0 auto;padding:44px 20px 20px}
.rt .tag{color:var(--teal);display:block;margin-bottom:12px}
html[data-theme="dark"] .rt .tag{color:var(--amber)}
.rt h1{font-family:var(--display);font-weight:800;font-size:clamp(28px,4.4vw,42px);
  letter-spacing:-.038em;line-height:1.08;margin:0 0 14px}
.rt .lead{font-size:17.5px;line-height:1.7;color:var(--muted);margin:0 0 28px;max-width:62ch}
.rt h2{font-family:var(--display);font-weight:700;font-size:21px;letter-spacing:-.025em;
  margin:40px 0 12px;padding-top:26px;border-top:1px solid var(--rule)}
.rt h3{font-family:var(--display);font-weight:700;font-size:16px;letter-spacing:-.015em;margin:24px 0 7px}
.rt p{margin:0 0 15px;font-size:15.5px;line-height:1.75;color:var(--slate)}
html[data-theme="dark"] .rt p{color:#C3CBD8}
.rt ul{margin:0 0 16px;padding-left:20px}
.rt li{font-size:15.5px;line-height:1.75;color:var(--slate);margin-bottom:7px}
html[data-theme="dark"] .rt li{color:#C3CBD8}
.rt a{color:var(--teal)}
html[data-theme="dark"] .rt a{color:var(--amber)}
.rt strong{color:var(--text)}

.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:0 0 30px}
.fact{background:var(--surface);border:1px solid var(--rule);border-radius:18px;padding:17px 19px}
.fact .k{font-family:var(--mono);font-size:9.5px;font-weight:600;letter-spacing:.11em;
  text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.fact .v{font-family:var(--mono);font-size:22px;font-weight:600;letter-spacing:-.02em}
.fact.hero{background:var(--ink);border-color:transparent;color:#fff}
.fact.hero .k{color:var(--amber)}
.fact.hero .v{color:#fff}

.cta{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;
  background:var(--surface);border:1px solid var(--rule);border-radius:22px;
  padding:24px;margin:32px 0}
.cta strong{display:block;font-family:var(--display);font-weight:700;font-size:18px;
  letter-spacing:-.02em;margin-bottom:5px}
.cta span{color:var(--muted);font-size:13.5px;line-height:1.6}
.cta .btn{flex:0 0 auto;display:inline-flex;align-items:center;height:50px;padding:0 26px;
  border-radius:14px;background:var(--teal);color:#fff;text-decoration:none;
  font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.09em;text-transform:uppercase}
html[data-theme="dark"] .cta .btn{background:var(--amber);color:#141A28}

.others{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:16px 0 0}
.other{display:flex;justify-content:space-between;gap:12px;align-items:baseline;
  padding:14px 17px;border:1px solid var(--rule);border-radius:15px;text-decoration:none;
  color:var(--text);transition:border-color .15s ease}
.other:hover{border-color:var(--teal)}
.other b{font-weight:600;font-size:14.5px}
.other span{font-family:var(--mono);font-size:12.5px;color:var(--muted);flex:0 0 auto}

/* Imagem da cidade. Sem ficheiro, fica um gradiente — a página
   nunca mostra um quadrado partido. */
.hero{position:relative;border-radius:22px;overflow:hidden;margin:0 0 24px;
  background:linear-gradient(140deg,var(--ink),#2A3348 60%,var(--teal));
  height:clamp(150px,20vw,230px)}
/* O site.css tem img{max-width:100%} e isso encolhia a foto dentro
   do bloco, deixando o fundo à vista em cima e em baixo. Preencher
   o contentor por inteiro resolve. */
.hero picture{position:absolute;inset:0;display:block}
.hero img{position:absolute;inset:0;width:100%;height:100%;max-width:none;
  object-fit:cover;object-position:center 45%}
/* O véu existe só para o texto branco ser legível. Estava tão
   carregado que apagava a foto — sobretudo horizontes com muito
   detalhe, onde o degradê achatava tudo. Agora só escurece a faixa
   de baixo, onde o título assenta, e deixa a foto respirar. */
.hero .veil{position:absolute;inset:0;
  background:linear-gradient(to top,rgba(12,16,26,.78) 0%,
    rgba(12,16,26,.42) 32%,rgba(12,16,26,.08) 58%,transparent 78%)}
/* Uma sombra atrás do texto, para não depender do véu para contraste. */
.hero .on h1{text-shadow:0 2px 14px rgba(8,11,18,.6)}
.hero .on .tag{text-shadow:0 1px 8px rgba(8,11,18,.7)}
.hero .on{position:absolute;left:0;right:0;bottom:0;padding:20px 22px}
.hero .on .tag{color:var(--amber);margin-bottom:6px}
.hero .on h1{color:#fff;margin:0;font-size:clamp(24px,3.4vw,34px)}

/* ---------- a calculadora ----------
   Campos em cima num cartão claro, resultado em baixo num cartão do
   mesmo tom mas com o contorno da marca. O escuro estava a competir
   com a fotografia por cima. */
.ca{margin:0 0 30px}
.ca-top{margin-bottom:14px}
.ca-top h2{font-family:var(--display);font-weight:700;font-size:clamp(20px,2.6vw,25px);
  letter-spacing:-.028em;margin:0;padding:0;border:0}

.ca-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;
  background:var(--surface);border:1px solid var(--rule);border-radius:20px;
  padding:16px;margin-bottom:10px}
.ca-f{display:flex;flex-direction:column;min-width:0;grid-column:span 2}
.ca-f.wide{grid-column:span 3}
.ca-f label{font-family:var(--mono);font-size:8.5px;font-weight:600;letter-spacing:.14em;
  text-transform:uppercase;color:var(--muted);margin-bottom:7px}
.ca-f label .hint{font-family:var(--body);font-size:10px;font-weight:400;letter-spacing:0;
  text-transform:none;opacity:.65;margin-left:5px}
.ca-in{position:relative;display:flex;align-items:center}
.ca-pin{position:absolute;left:14px;width:7px;height:7px;border-radius:999px}
.ca-pin.a{background:var(--teal)}
.ca-pin.b{background:var(--amber)}
html[data-theme="dark"] .ca-pin.a{background:var(--amber)}
html[data-theme="dark"] .ca-pin.b{background:var(--teal)}
.ca-in input,.ca-in select{height:46px;padding:0 13px;border-radius:12px;
  border:1px solid var(--rule-strong);background:var(--field);color:var(--text);
  font-family:inherit;font-size:14.5px;font-weight:500;outline:none;width:100%;
  text-overflow:ellipsis;transition:border-color .14s ease,box-shadow .14s ease}
.ca-pin ~ input{padding-left:29px}
.ca-in select{padding-right:26px;-webkit-appearance:none;appearance:none;cursor:pointer;
  font-weight:600;
  background-image:linear-gradient(45deg,transparent 50%,var(--muted) 50%),
    linear-gradient(135deg,var(--muted) 50%,transparent 50%);
  background-position:calc(100% - 13px) 21px,calc(100% - 9px) 21px;
  background-size:4px 4px,4px 4px;background-repeat:no-repeat}
.ca-in input::placeholder{color:var(--muted);font-weight:400}
.ca-in input::-webkit-calendar-picker-indicator{opacity:.4;cursor:pointer}
.ca-in input:focus,.ca-in select:focus{border-color:var(--teal);
  box-shadow:0 0 0 3px rgba(15,118,110,.13)}
html[data-theme="dark"] .ca-in input:focus,html[data-theme="dark"] .ca-in select:focus{
  border-color:var(--amber);box-shadow:0 0 0 3px rgba(232,163,61,.15)}

/* O resultado. Claro, com um traço da marca à esquerda para se ler
   como resposta e não como mais um campo por preencher. */
.ca-out{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;
  background:var(--surface);border:1px solid var(--rule);border-left:3px solid var(--teal);
  border-radius:20px;padding:18px 22px}
html[data-theme="dark"] .ca-out{border-left-color:var(--amber)}
.ca-left{min-width:0}
.ca-veh{display:flex;align-items:center;gap:14px;min-width:0;margin-bottom:12px}
.ca-art{flex:0 0 auto;width:70px;color:var(--slate);opacity:.85}
html[data-theme="dark"] .ca-art{color:#8C97A8}
.ca-art svg{width:100%;height:auto;fill:currentColor}
.ca-art svg .w{fill:var(--surface)}
.ca-vt{min-width:0}
.ca-vt strong{display:block;font-family:var(--display);font-weight:700;font-size:15.5px;
  letter-spacing:-.02em;margin-bottom:3px}
.ca-vt span{display:block;font-size:12px;color:var(--muted);line-height:1.5}

/* As escolhas, em etiquetas. Quem desce a página não perde de vista
   para que dia e para quantas pessoas é o preço que está a ver. */
.ca-chips{display:flex;gap:7px;flex-wrap:wrap}
.chip{background:var(--surface-2);border:1px solid var(--rule);border-radius:999px;
  padding:5px 12px;font-family:var(--mono);font-size:10.5px;font-weight:600;
  letter-spacing:.02em;color:var(--muted);white-space:nowrap}

.ca-pay{text-align:right;min-width:0;flex:0 0 auto}
.ca-pay .k{display:block;font-family:var(--mono);font-size:8.5px;font-weight:600;
  letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.ca-pay .v{display:block;font-family:var(--mono);font-size:clamp(28px,4vw,34px);
  font-weight:600;letter-spacing:-.035em;line-height:1;color:var(--teal)}
html[data-theme="dark"] .ca-pay .v{color:var(--amber)}
.ca-pay .s{display:block;font-size:11.5px;color:var(--muted);margin-top:7px}
 /* A promessa, por cima do botão. Com a data do pagamento deixa de
   ser uma frase de marketing e passa a ser um compromisso. */
.ca-later{display:block;margin-top:14px;font-size:12.5px;font-weight:600;color:var(--teal)}
html[data-theme="dark"] .ca-later{color:var(--amber)}
.ca-later.off{display:none}

/* O botao diz o que faz, e nada mais. O seletor leva o .rt a frente
   de proposito: a regra das ligacoes pinta tudo de verde, e com
   menos especificidade o texto do botao ficava verde sobre verde. */
.rt a.ca-book{display:inline-flex;align-items:center;justify-content:center;height:46px;
  padding:0 26px;margin-top:9px;border-radius:13px;background:var(--teal);color:#fff;
  text-decoration:none;font-family:var(--body);font-size:15px;font-weight:600;
  letter-spacing:-.01em;white-space:nowrap;
  transition:transform .14s ease,box-shadow .14s ease;
  box-shadow:0 6px 18px rgba(15,118,110,.28)}
.rt a.ca-book:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(15,118,110,.34)}
html[data-theme="dark"] .rt a.ca-book{background:var(--amber);color:#141A28;
  box-shadow:0 6px 18px rgba(232,163,61,.26)}
html[data-theme="dark"] .rt a.ca-book:hover{box-shadow:0 10px 24px rgba(232,163,61,.32)}

/* As garantias, em linha por baixo do preço. */
.ca-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
.tr{display:flex;gap:10px;align-items:flex-start;background:var(--surface-2);
  border-radius:13px;padding:12px 14px}
.tr svg{width:17px;height:17px;flex:0 0 auto;margin-top:1px;color:var(--teal)}
html[data-theme="dark"] .tr svg{color:var(--amber)}
.tr strong{display:block;font-size:12.5px;font-weight:600;margin-bottom:2px}
.tr span{display:block;color:var(--muted);font-size:11.5px;line-height:1.45}
@media (max-width:900px){.ca-trust{grid-template-columns:1fr 1fr}}
@media (max-width:520px){.ca-trust{grid-template-columns:1fr}}

.ca-n{margin:10px 4px 0;color:var(--muted);font-size:12.5px;line-height:1.55}
.ca-n:empty{margin:0}

/* A lista do que está incluído, com um ícone por linha. Continua a
   ser uma lista, não blocos — só troca o ponto por um desenho. */
.rt ul.ticks{list-style:none;padding:0;margin:0 0 16px}
.rt ul.ticks li{display:flex;gap:12px;align-items:flex-start;padding:9px 0;
  border-bottom:1px solid var(--rule);margin:0}
.rt ul.ticks li:last-child{border-bottom:0}
.rt ul.ticks svg{width:19px;height:19px;flex:0 0 auto;margin-top:2px;color:var(--teal)}
html[data-theme="dark"] .rt ul.ticks svg{color:var(--amber)}
.rt ul.ticks span{flex:1;min-width:0}

/* A lista de sugestões do Google, com o aspeto do site. */
.pac-container{border-radius:12px;border:1px solid var(--rule-strong);
  box-shadow:0 12px 30px rgba(20,26,40,.16);font-family:var(--body);margin-top:4px;
  background:var(--surface)}
.pac-item{padding:9px 13px;border-top:1px solid var(--rule);font-size:13.5px;
  color:var(--muted);cursor:pointer}
.pac-item:first-child{border-top:0}
.pac-item:hover,.pac-item-selected{background:var(--surface-2)}
.pac-item-query{font-size:14px;color:var(--text)}
.pac-icon{display:none}

@media (max-width:900px){
  .ca-grid{grid-template-columns:repeat(4,1fr)}
  .ca-f.wide{grid-column:span 4}
  .ca-f{grid-column:span 2}
  .ca-f:last-child{grid-column:span 4}
  .ca-out{grid-template-columns:1fr;gap:16px}
  .ca-pay{text-align:left;border-top:1px solid var(--rule);padding-top:16px}
  .ca-book{width:100%;justify-content:center}
}
@media (max-width:520px){
  .ca-grid{grid-template-columns:1fr 1fr}
  .ca-f,.ca-f.wide,.ca-f:last-child{grid-column:span 2}
}

/* ---------- blocos das secções de baixo ----------
   Texto corrido de seis parágrafos não se lê numa página vinda de
   uma pesquisa. Em blocos curtos, lê-se de relance. */

/* Os passos do tempo real, numerados. */
.steps{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 18px}
.step{display:flex;gap:12px;align-items:flex-start;background:var(--surface);
  border:1px solid var(--rule);border-radius:14px;padding:13px 15px}
.step .n{flex:0 0 auto;width:24px;height:24px;border-radius:8px;display:flex;
  align-items:center;justify-content:center;background:var(--teal-soft);color:var(--teal);
  font-family:var(--mono);font-size:11px;font-weight:600}
html[data-theme="dark"] .step .n{background:rgba(232,163,61,.13);color:var(--amber)}
.step strong{display:block;font-size:13.5px;font-weight:600;margin-bottom:3px}
.step span{display:block;color:var(--muted);font-size:12.5px;line-height:1.5}

/* Quando reservar, com um travessão colorido por urgência. */
.when{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin:0 0 16px}
.when-i{background:var(--surface);border:1px solid var(--rule);border-radius:14px;
  padding:14px 16px;border-left:3px solid var(--rule-strong)}
.when-i.bad{border-left-color:#C0392B}
.when-i.warn{border-left-color:var(--amber)}
.when-i.ok{border-left-color:var(--teal)}
.when-i strong{display:block;font-family:var(--display);font-weight:700;font-size:14px;
  letter-spacing:-.015em;margin-bottom:4px}
.when-i span{display:block;color:var(--muted);font-size:12.5px;line-height:1.55}

/* O que só se sabe tendo lá estado. */
.local{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 8px}
.local-i{background:var(--surface);border:1px solid var(--rule);border-radius:15px;
  padding:16px 18px}
.local-i strong{display:block;font-family:var(--display);font-weight:700;font-size:14.5px;
  letter-spacing:-.018em;margin-bottom:6px}
.local-i span{display:block;color:var(--muted);font-size:13px;line-height:1.6}

@media (max-width:700px){
  .steps,.when,.local{grid-template-columns:1fr}
}

/* A lista de sugestões do Google, com o aspeto do site. */
.pac-container{border-radius:12px;border:1px solid var(--rule-strong);
  box-shadow:0 12px 30px rgba(20,26,40,.16);font-family:var(--body);margin-top:4px;
  background:var(--surface)}
.pac-item{padding:9px 13px;border-top:1px solid var(--rule);font-size:13.5px;
  color:var(--muted);cursor:pointer}
.pac-item:first-child{border-top:0}
.pac-item:hover,.pac-item-selected{background:var(--surface-2)}
.pac-item-query{font-size:14px;color:var(--text)}
.pac-icon{display:none}

@media (max-width:900px){
  .ca-grid{grid-template-columns:repeat(4,1fr)}
  .ca-f.wide{grid-column:span 4}
  .ca-f{grid-column:span 2}
  .ca-f:last-child{grid-column:span 4}
  .ca-out{grid-template-columns:1fr;gap:16px}
  .ca-pay{text-align:left;border-top:1px solid rgba(255,255,255,.09);padding-top:16px}
  .ca-book{width:100%;justify-content:center}
}
@media (max-width:520px){
  .ca-grid{grid-template-columns:1fr 1fr}
  .ca-f,.ca-f.wide,.ca-f:last-child{grid-column:span 2}
}

.crumb{font-family:var(--mono);font-size:11px;letter-spacing:.05em;color:var(--muted);
  margin-bottom:18px}
.crumb a{color:var(--muted);text-decoration:none}
.crumb a:hover{color:var(--teal)}

@media (max-width:760px){
  .facts{grid-template-columns:1fr 1fr}
  .others{grid-template-columns:1fr}
}
</style>
</head>
<body data-cta-href="/#book" data-cta-label="${t9n(lang, 'Get a price')}">

<main id="main">
<article class="rt">`;
}

const foot = `</article>
</main>
</body>
</html>
`;

// ============================================================
// BLOCOS REUTILIZÁVEIS
// ============================================================

/** A imagem da cidade, ou um gradiente quando ela não existe. */
function hero(airport, tag, title) {
  const inner = `<div class="veil"></div><div class="on">` +
    `<span class="tag">${esc(tag)}</span><h1>${esc(title)}</h1></div>`;

  // Sem "image" no JSON, usa-se a genérica em vez de um gradiente
  // vazio — assim um aeroporto novo entra com aspecto decente antes
  // de alguém ir procurar a foto dele.
  const name = airport.image || 'default';

  // <picture> tenta os formatos por ordem e fica no primeiro que
  // existir. Assim tanto faz a foto ser .webp ou .jpg — poupa ter
  // de acertar a extensão no código sempre que se muda de fonte,
  // e nos países que vierem a seguir.
  const base = `/assets/img/cities/${esc(name)}`;

  // O <picture> escolhe pelo NOME, não sabe se o ficheiro existe —
  // por isso a rede de segurança tem de ser o onerror do <img>: se
  // a foto da cidade faltar, entra a genérica. Assim os aeroportos
  // pequenos podem esperar sem deixarem um buraco na página.
  //
  // O this.onerror=null impede o ciclo se a própria genérica faltar.
  const fallback = '/assets/img/cities/default.webp';
  const onerr = `this.onerror=null;this.src='${fallback}';` +
    `var p=this.parentNode;if(p&&p.tagName==='PICTURE'){` +
    `p.querySelectorAll('source').forEach(function(s){s.remove();});}`;

  return `<div class="hero"><picture>` +
    `<source srcset="${base}.webp" type="image/webp">` +
    `<source srcset="${base}.jpg" type="image/jpeg">` +
    `<img src="${base}.jpg" alt="${esc(airport.city)}" ` +
    `width="1600" height="600" loading="eager" fetchpriority="high" ` +
    `onerror="${onerr}">` +
    `</picture>${inner}</div>`;
}



/**
 * A calculadora.
 *
 * O mesmo comportamento da página inicial: distância, duração,
 * veículo e preço atualizam-se enquanto a pessoa mexe nos campos.
 *
 * O Google Maps só carrega ao primeiro toque: numa página de
 * pesquisa, a maioria das visitas nunca usa a calculadora, e
 * carregá-lo a todas custaria dinheiro por visita.
 */
function calculator(airport, current, cc, mapsKey, lang) {
  const to = current ? current.name : '';

  return `<section class="ca" id="price">
    <div class="ca-top">
      <h2>${t9n(lang, 'Price your transfer')}</h2>
    </div>

    <div class="ca-grid">
      <div class="ca-f wide">
        <label for="cf">${t9n(lang, 'Pick-up')}</label>
        <div class="ca-in"><span class="ca-pin a"></span>
          <input id="cf" type="text" value="${esc(airport.name)}" autocomplete="off"
                 placeholder="${t9n(lang, 'Airport, hotel or address')}"></div>
      </div>

      <div class="ca-f wide">
        <label for="ct">${t9n(lang, 'Drop-off')}</label>
        <div class="ca-in"><span class="ca-pin b"></span>
          <input id="ct" type="text" value="${esc(to)}" autocomplete="off"
                 placeholder="${t9n(lang, 'Hotel, address or town')}"></div>
      </div>

      <div class="ca-f">
        <label for="cdate">${t9n(lang, 'Date')}</label>
        <div class="ca-in"><input id="cdate" type="date"></div>
      </div>

      <div class="ca-f">
        <label for="ctime">${t9n(lang, 'Pick-up time')}</label>
        <div class="ca-in"><input id="ctime" type="time" value="12:00"></div>
      </div>

      <div class="ca-f">
        <label for="cp">${t9n(lang, 'Passengers')} <span class="hint">1 &ndash; 16</span></label>
        <div class="ca-in">
          <input id="cp" type="number" min="1" max="16" step="1" value="2">
        </div>
      </div>
    </div>

    <div class="ca-out">
      <div class="ca-left">
        <div class="ca-veh">
          <div class="ca-art" id="cart"></div>
          <div class="ca-vt">
            <strong id="cw">${t9n(lang, 'Sedan')}</strong>
            <span id="cwn">${t9n(lang, 'Up to 4 passengers with hand luggage.')}</span>
          </div>
        </div>

        <!-- O que foi escolhido, repetido aqui. Sem isto, quem
             desce a página perde de vista para que dia reservou. -->
        <div class="ca-chips">
          <span class="chip" id="chDate">&mdash;</span>
          <span class="chip" id="chTime">12:00</span>
          <span class="chip" id="chPax">2 ${t9n(lang, 'passengers')}</span>
          <span class="chip" id="chKm">&mdash;</span>
          <span class="chip" id="chDur">&mdash;</span>
        </div>
      </div>

      <div class="ca-pay">
        <span class="k" id="ck">${t9n(lang, 'From')}</span>
        <span class="v" id="cv">&mdash;</span>
        <span class="s" id="cs">${t9n(lang, 'Whole car &middot; tolls and taxes in')}</span>

        <!-- A promessa fica por cima do botão, com a data do
             pagamento. O botão diz só o que faz. -->
        <span class="ca-later" id="cl">${t9n(lang, 'Book now, pay later')}</span>
        <a class="ca-book" id="cb" href="/booking/">${t9n(lang, 'See prices &rarr;')}</a>
      </div>
    </div>

    <!-- As condições, por baixo do preço. Quem reserva daqui não
         desce a página a ler o resto — o que decide a compra tem de
         estar onde a compra se faz. -->
    <div class="ca-trust">
      ${[
        ['M9 14l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
         t9n(lang, 'Free cancellation'), t9n(lang, 'Until 24 hours before, refunded in full')],
        ['M2 9h20M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2M2 9v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9M6 15h4',
         t9n(lang, 'No card today'), t9n(lang, 'Charged 48 hours before you travel')],
        ['M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.4-2.1 2.1-2.4-.6a.5.5 0 0 0-.5.8L5 16l1.3 2.2a.5.5 0 0 0 .8-.1l.6-2.4 2.1-2.1 4.4 3.9a.5.5 0 0 0 .8-.5Z',
         t9n(lang, 'Flight tracked'), t9n(lang, 'Land late and the driver waits, free')],
        ['M12 2 4 6v6c0 5 3.4 9.4 8 10 4.6-.6 8-5 8-10V6l-8-4Z',
         t9n(lang, 'Licensed drivers'), t9n(lang, 'Insurance and licence checked by us')]
      ].map(([d, t, sub]) => `<div class="tr">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="${d}"/></svg>
        <div><strong>${t}</strong><span>${sub}</span></div>
      </div>`).join('')}
    </div>

    <p class="ca-n" id="cn"></p>
  </section>

  <script>
  // A tabela desta zona, impressa pelo gerador: a calculadora da
  // página usa-a sem adivinhar nada.
  window.__ZONE = ${JSON.stringify(zoneFor(cc, slugOf(airport), current))};

  // A língua e as frases que o código da página precisa. Impressas
  // aqui e não pedidas ao dicionário: esta página é estática e não
  // carrega o i18n.js.
  var LANG = ${JSON.stringify(lang || 'en')};
  var PAY_ON = ${JSON.stringify(t9n(lang, 'payOn') !== 'payOn' ? t9n(lang, 'payOn') : 'Book now, pay on {data}')};
  var L_FROM = ${JSON.stringify(t9n(lang, 'From'))};
  var L_PAX  = ${JSON.stringify(t9n(lang, 'passengers'))};
  var L_PAX1 = ${JSON.stringify(t9n(lang, 'passenger'))};
  var DATE_LOC = ${JSON.stringify({ pt:'pt-PT', es:'es-ES', de:'de-DE', fr:'fr-FR' }[lang] || 'en-GB')};

  // As etiquetas que o código da calculadora reescreve. Impressas
  // aqui porque esta página é estática e não pede nada ao servidor.
  var L_WHOLE = ${JSON.stringify(t9n(lang, 'Whole car &middot; tolls and taxes in').replace('&middot;', '\u00b7'))};
  var L_CONT  = ${JSON.stringify(t9n(lang, 'Continue &rarr;').replace('&rarr;', '\u2192'))};
  var L_CARS  = ${JSON.stringify({
    Sedan:   [t9n(lang, 'Sedan'),   t9n(lang, 'Up to 4 passengers with hand luggage.')],
    Van:     [t9n(lang, 'Van'),     t9n(lang, 'Up to 8 passengers with a suitcase each.')],
    Minibus: [t9n(lang, 'Minibus'), ''],
    Coach:   [t9n(lang, 'Coach'),   '']
  })};
  </script>
  <script>
  (function () {
    var KEY = ${JSON.stringify(mapsKey)};
    var CC = ${JSON.stringify(cc)};

    var $$ = function (id) { return document.getElementById(id); };
    var cf = $$('cf'), ct = $$('ct'), cp = $$('cp');
    var cdate = $$('cdate'), ctime = $$('ctime');
    var cw = $$('cw'), cwn = $$('cwn'), cart = $$('cart');
    var chDate = $$('chDate'), chTime = $$('chTime'), chPax = $$('chPax');
    var chKm = $$('chKm'), chDur = $$('chDur');
    var cv = $$('cv'), ck = $$('ck'), cs = $$('cs'), cn = $$('cn'), cb = $$('cb');
    var cl = $$('cl');
    if (!cf || !ct) return;

    // Daqui a três dias, não amanhã.
    //
    // Amanhã está dentro das 48 horas, e isso tira o "pagar depois"
    // a toda a gente logo à partida — a vantagem que mais nos
    // distingue desapareceria antes de alguém a ver.
    var t = new Date(); t.setDate(t.getDate() + 3);
    cdate.value = t.toISOString().slice(0, 10);
    cdate.min = new Date().toISOString().slice(0, 10);

    // ---------- a mesma fórmula do site ----------
    function fare(km, pax) {
      // A zona vem impressa na página: cada aeroporto traz a sua
      // tabela e os seus multiplicadores, para a calculadora não ter
      // de saber nada sobre países.
      var z = window.__ZONE;
      if (!z) return Math.max(25, (20 + km * 3.5) * 1.3);

      var cls = pax <= 3 ? 'sedan' : pax <= 4 ? 'premium'
        : pax <= 8 ? 'van' : pax <= 13 ? 'van_sedan' : 'two_vans';

      if (z.fixed) {
        if (cls === 'sedan') return z.fixed.sedan;
        if (cls === 'premium') return z.fixed.premium;
        return z.fixed.sedan * z[cls];
      }

      return Math.max(24, (z.base + km * z.perKm) * (cls === 'sedan' ? 1 : z[cls]));
    }

    /**
     * Os veículos, de perfil.
     *
     * Preenchidos e não em traço: a esta escala, um contorno fino
     * lê-se como um rabisco. As rodas são círculos vazados para se
     * distinguirem da carroçaria sem precisar de mais uma cor.
     */
    var VEHICLES = {
      Sedan: ['Up to 4 passengers with hand luggage.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M9 40V31c0-2 1-4 3-4l9-1 10-11c2-2 4-3 7-3h25c3 0 5 1 7 3l9 11 25 3c5 1 8 4 8 8v3c0 2-2 4-4 4H13c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M38 27 46 17c1-1 2-2 4-2h11v12H38Z"/>' +
        '<path class="w" d="M67 15h11c2 0 3 1 4 2l9 10H67V15Z"/>' +
        '<circle cx="35" cy="41" r="8"/><circle class="w" cx="35" cy="41" r="3.4"/>' +
        '<circle cx="98" cy="41" r="8"/><circle class="w" cx="98" cy="41" r="3.4"/>' +
        '</svg>'],

      Van: ['Up to 8 passengers with a suitcase each.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M8 40V16c0-3 2-5 5-5h58c2 0 4 1 5 2l19 15 22 4c5 1 8 4 8 8v2c0 2-2 4-4 4H12c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M18 16h20v12H18V16Z"/><path class="w" d="M45 16h20v12H45V16Z"/>' +
        '<path class="w" d="M72 16h5l14 12H72V16Z"/>' +
        '<circle cx="34" cy="41" r="8.5"/><circle class="w" cx="34" cy="41" r="3.6"/>' +
        '<circle cx="99" cy="41" r="8.5"/><circle class="w" cx="99" cy="41" r="3.6"/>' +
        '</svg>'],

      Minibus: ['Up to 13 passengers with luggage.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M6 40V13c0-3 2-5 5-5h108c3 0 5 2 5 5v27c0 2-2 4-4 4H10c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M14 14h22v12H14V14Z"/><path class="w" d="M42 14h22v12H42V14Z"/>' +
        '<path class="w" d="M70 14h22v12H70V14Z"/><path class="w" d="M98 14h18v12H98V14Z"/>' +
        '<circle cx="33" cy="41" r="8.5"/><circle class="w" cx="33" cy="41" r="3.6"/>' +
        '<circle cx="100" cy="41" r="8.5"/><circle class="w" cx="100" cy="41" r="3.6"/>' +
        '</svg>'],

      Coach: ['Up to 16 passengers with luggage.',
        '<svg viewBox="0 0 132 52">' +
        '<path d="M4 40V10c0-3 2-5 5-5h114c3 0 5 2 5 5v30c0 2-2 4-4 4H8c-2 0-4-2-4-4Z"/>' +
        '<path class="w" d="M11 11h18v11H11V11Z"/><path class="w" d="M34 11h18v11H34V11Z"/>' +
        '<path class="w" d="M57 11h18v11H57V11Z"/><path class="w" d="M80 11h18v11H80V11Z"/>' +
        '<path class="w" d="M103 11h18v11h-18V11Z"/>' +
        '<circle cx="31" cy="41" r="8.5"/><circle class="w" cx="31" cy="41" r="3.6"/>' +
        '<circle cx="101" cy="41" r="8.5"/><circle class="w" cx="101" cy="41" r="3.6"/>' +
        '</svg>']
    };

    function car(pax) {
      return pax <= 4 ? 'Sedan' : pax <= 8 ? 'Van' : pax <= 13 ? 'Minibus' : 'Coach';
    }

    function drawCar(pax) {
      // A chave é sempre em inglês — é o identificador do desenho.
      // O que se mostra vem de L_CARS, na língua da página.
      var chave = car(pax);
      var rotulo = L_CARS[chave] || [chave, ''];
      cw.textContent = rotulo[0];
      cwn.textContent = rotulo[1] || VEHICLES[chave][0];
      cart.innerHTML = VEHICLES[chave][1];
    }

    // ---------- travão contra abuso ----------
    var CAP_BURST = 10, CAP_TOTAL = 50;

    function quota() {
      try {
        var log = JSON.parse(sessionStorage.getItem('al-q') || '[]');
        var now = Date.now();
        if (log.length >= CAP_TOTAL) return 'total';
        if (log.filter(function (x) { return now - x < 60000; }).length >= CAP_BURST) return 'burst';
        log.push(now);
        sessionStorage.setItem('al-q', JSON.stringify(log.slice(-CAP_TOTAL)));
        return null;
      } catch (e) { return null; }
    }

    // ---------- o Google, só ao primeiro toque ----------
    var loading = false, ready = false, queue = null;

    function maps(then) {
      if (ready) return then && then();
      if (then) queue = then;
      if (loading) return;

      loading = true;
      window.alReady = function () {
        ready = true;
        [cf, ct].forEach(function (el) {
          var ac = new google.maps.places.Autocomplete(el,
            { fields: ['formatted_address', 'name'] });
          ac.addListener('place_changed', function () {
            var p = ac.getPlace();
            if (p) el.value = p.formatted_address || p.name || el.value;
            run();
          });
        });
        if (queue) { var f = queue; queue = null; f(); }
      };

      var sc = document.createElement('script');
      // language=en é obrigatório: sem ele o Google devolve a
      // duração na língua do browser, e uma página em inglês
      // acabava a dizer "40 minutos".
      sc.src = 'https://maps.googleapis.com/maps/api/js?key=' + KEY +
        '&loading=async&libraries=places&callback=alReady&language=en&region=PT';
      sc.async = true;
      document.head.appendChild(sc);
    }

    // ---------- ao vivo ----------
    var lastKey = '', timer = null, km = 0;

    /**
     * A promessa por cima do botão.
     *
     * "Book now, pay later" sozinho é uma frase de marketing. Com a
     * data, passa a ser um compromisso: a pessoa sabe exatamente
     * quando o cartão é debitado.
     */
    function laterLine() {
      if (!cdate.value) return 'Book now, pay later';

      var pick = new Date(cdate.value + 'T' + (ctime.value || '12:00'));
      var at = new Date(pick.getTime() - 48 * 36e5);

      // Menos de 48 horas: não há "depois" nenhum, e prometê-lo
      // seria mentira.
      if (isNaN(at.getTime()) || at < new Date()) return '';

      // A data no formato da língua, e a frase com marcador: em
      // português a data vem depois de "a", em alemão depois de "am".
      var loc = { pt: 'pt-PT', es: 'es-ES', de: 'de-DE', fr: 'fr-FR' }[LANG] || 'en-GB';
      var quando = at.toLocaleDateString(loc, { day: 'numeric', month: 'long' });
      return (PAY_ON || 'Book now, pay on {data}').split('{data}').join(quando);
    }

    /** As etiquetas com o que foi escolhido. */
    function chips() {
      var pax = Number(cp.value) || 1;

      if (cdate.value) {
        var d = new Date(cdate.value + 'T12:00');
        chDate.textContent = isNaN(d) ? '\u2014'
          : d.toLocaleDateString(DATE_LOC, { weekday: 'short', day: 'numeric', month: 'short' });
      } else {
        chDate.textContent = '\u2014';
      }

      chTime.textContent = ctime.value || '\u2014';
      chPax.textContent = pax + ' ' + (pax === 1 ? L_PAX1 : L_PAX);
    }

    function paint(price) {
      var pax = Number(cp.value) || 1;
      drawCar(pax);
      chips();

      // A promessa aparece SEMPRE, com ou sem preço: é uma condição
      // da reserva, não um resultado do cálculo.
      var later = laterLine();
      cl.textContent = later;
      cl.classList.toggle('off', !later);

      // O botão está SEMPRE lá. Um botão que só aparece depois de
      // um cálculo deixa a secção sem saída para quem não esperou —
      // e a pessoa que quer reservar sem ver o preço fica presa.
      cb.href = '/booking/?from=' + encodeURIComponent(cf.value.trim()) +
        '&to=' + encodeURIComponent(ct.value.trim()) +
        '&date=' + encodeURIComponent(cdate.value) +
        '&time=' + encodeURIComponent(ctime.value) +
        '&pax=' + pax;

      cs.textContent = L_WHOLE;

      if (!price) {
        cv.textContent = '\u2014';
        cb.textContent = 'See prices \u2192';
        return;
      }

      cv.textContent = '\u20ac' + Math.round(price);
      cb.textContent = L_CONT;
    }

    function run() {
      var from = cf.value.trim(), to = ct.value.trim();
      var pax = Number(cp.value) || 1;

      if (!from || !to) {
        chKm.textContent = chDur.textContent = '\u2014';
        ck.textContent = L_FROM;
        cn.textContent = '';
        paint(0);
        return;
      }

      // Mudar passageiros, data ou hora não pede rota nova: a
      // distância é a mesma e já a temos.
      var key = from + '|' + to;
      if (key === lastKey && km) { ck.textContent = L_FROM; paint(fare(km, pax)); return; }

      var stop = quota();
      if (stop) {
        ck.textContent = stop === 'burst' ? 'Slow down' : 'Enough for now';
        cv.textContent = '\u2014';
        cn.textContent = stop === 'burst'
          ? 'That is a lot of routes in one minute. Give it a moment.'
          : 'You have priced plenty of routes. Reload the page to start again.';
        return;
      }

      ck.textContent = 'Working it out';
      cv.textContent = '\u2026';

      maps(function () {
        new google.maps.DirectionsService().route({
          origin: from, destination: to, travelMode: google.maps.TravelMode.DRIVING
        }, function (res, status) {
          if (status !== 'OK' || !res.routes.length) {
            lastKey = ''; km = 0;
            chKm.textContent = chDur.textContent = '\u2014';
            ck.textContent = 'No route';
            cn.textContent = 'We could not find a road between those two. Check the ' +
              'spelling, or try the town name.';
            paint(0);
            return;
          }

          var leg = res.routes[0].legs[0];
          km = leg.distance.value / 1000;
          lastKey = key;

          chKm.textContent = km.toFixed(0) + ' km';
          chDur.textContent = leg.duration.text;
          ck.textContent = L_FROM;
          cn.textContent = '';
          paint(fare(km, pax));
        });
      });
    }

    // Meio segundo depois da última tecla: sem isto pedia-se uma
    // rota por cada letra escrita.
    function later() { clearTimeout(timer); timer = setTimeout(run, 550); }

    [cf, ct].forEach(function (el) {
      el.addEventListener('input', later);
      el.addEventListener('focus', function () { maps(); }, { once: true });
      el.addEventListener('focus', function () { this.select(); });
    });

    cp.addEventListener('change', run);
    cdate.addEventListener('change', function () { paint(km ? fare(km, Number(cp.value) || 1) : 0); });
    ctime.addEventListener('change', function () { paint(km ? fare(km, Number(cp.value) || 1) : 0); });

    drawCar(Number(cp.value) || 1);
    chips();

    // As etiquetas acompanham sempre, mesmo sem preço ainda.
    [cdate, ctime, cp].forEach(function (el) { el.addEventListener('change', chips); });

    /**
     * O preço aparece sozinho, sem esperar por um toque.
     *
     * Estava à espera do primeiro gesto para não carregar o Maps a
     * quem só passa pela página — mas o resultado era um preço a
     * tracejado, que é o contrário do que a pessoa veio buscar.
     *
     * Um segundo de atraso: quem chega e sai depressa não chega a
     * gastar nada, e quem fica tem o preço quase de imediato.
     */
    if (cf.value.trim() && ct.value.trim()) {
      setTimeout(run, 1000);
    }
  })();
  </script>`;
}

/**
 * Quanto tempo antes reservar.
 *
 * Ninguém no setor responde a isto, e é das primeiras coisas que
 * alguém pensa ao planear. Uma pergunta com resposta útil e sem
 * concorrência é exatamente o que faz uma página ser encontrada.
 */
function whenToBook(dest, lang) {
  const far = dest.km > 60;

  return `<h2 id="when">${t9n(lang, 'When to book')}</h2>
  <p>${t9n(lang, 'bookEarly') !== 'bookEarly' ? t9n(lang, 'bookEarly')
    : 'Booking early costs the same as booking late &mdash; the price does not move. What moves is whether there is a car left.'}</p>

  <div class="when">
    ${[
      ['bad', t9n(lang, 'A week ahead'),
       (frase(lang, 'busyArrivals', { extra: far ? t9n(lang, 'longRun') : '' }) ||
         `July, August, Fridays and Saturdays. The busiest arrivals of the year${
           far ? ', and a long run like this one is the first to run out' : ''}.`)],
      ['bad', t9n(lang, 'As soon as you have the flight'),
       t9n(lang, 'Groups of five or more. Vans and minibuses go first, always.')],
      ['warn', t9n(lang, 'Two or three days'),
       t9n(lang, 'Landing between 23:00 and 06:00. Fewer drivers are working.')],
      ['ok', t9n(lang, 'The day before is fine'),
       t9n(lang, 'Everything else. The same morning usually works too.')]
    ].map(([tone, k, v]) => `<div class="when-i ${tone}">
      <strong>${k}</strong><span>${esc(v)}</span>
    </div>`).join('')}
  </div>

  <p>${t9n(lang, 'cancelFree') !== 'cancelFree' ? t9n(lang, 'cancelFree')
    : 'Cancellation is free until 24 hours before, so booking early costs you nothing if the plan changes.'}</p>`;
}

/**
 * O tempo real, não o do mapa.
 *
 * O Google Maps diz o tempo a conduzir. O que interessa a quem
 * chega é o tempo desde a aterragem — e a diferença é o controlo de
 * passaportes e a bagagem, que costuma ser mais do que a viagem.
 */
function realTime(airport, dest, lang) {
  const d = dest.minutes;

  return `<h2 id="timing">${t9n(lang, 'How long it really takes')}</h2>
  <p>${frase(lang, 'mapsSays', { min: d }) ||
    `Maps says ${d} minutes. That is the driving. Door to door from the moment you land is a different number, and it is the one worth planning around.`}</p>

  <div class="steps">
    ${[
      [t9n(lang, 'Taxi and disembark'), t9n(lang, '10&ndash;15 min')],
      [t9n(lang, 'Passport control'), t9n(lang, 'None inside Schengen. 15&ndash;45 min from outside it.')],
      [t9n(lang, 'Baggage reclaim'), t9n(lang, '10&ndash;25 min with hold luggage')],
      [t9n(lang, 'Finding your driver'), t9n(lang, '2&ndash;5 min. Your name on a sign.')],
      [t9n(lang, 'The drive'), `${d} min`]
    ].map(([k, v], i) => `<div class="step">
      <span class="n">${i + 1}</span>
      <div><strong>${k}</strong><span>${v}</span></div>
    </div>`).join('')}
  </div>

  <p><strong>${frase(lang, 'realistically', { min1: d + 30, min2: d + 75 }) ||
    `Realistically, ${d + 30} to ${d + 75} minutes after landing.`}</strong>
  ${t9n(lang, 'ifWaiting') !== 'ifWaiting' ? t9n(lang, 'ifWaiting')
    : 'If someone is waiting for you, that is the number to give them.'}</p>`;
}



/** O que só se sabe tendo lá estado. */
function localInfo(airport, lang) {
  if (!airport.local || !airport.local.length) return '';

  return `<h2 id="local">${t9n(lang, 'Before you land')}</h2>
  <div class="local">
    ${airport.local.map(([t, body]) => `<div class="local-i">
      <strong>${esc(t)}</strong><span>${esc(body)}</span>
    </div>`).join('')}
  </div>`;
}

// ============================================================
// PÁGINA DE ROTA
// ============================================================

function routePage(country, airport, dest, siblings, lang, alternates) {
  lang = lang || 'en';

  // O texto traduzido substitui o inglês; o resto — quilómetros,
  // slug, preços — é o mesmo em todas as línguas.
  airport = traduz(airport, lang) || airport;
  dest = traduz(dest, lang) || dest;

  const cc = country.countryCode;
  const slug = slugOf(airport);
  const p1 = priceEUR(dest.km, 1, cc, slug, dest.slug);
  const p5 = priceEUR(dest.km, 5, cc, slug, dest.slug);

  const cslug = countrySlug(country);
  const pref = (LANGS.find((l) => l.code === lang) || LANGS[0]).prefix;
  const url = `${SITE}${pref}/transfers/${cslug}/${slug}-to-${dest.slug}/`;
  const title = t9n(lang, 'titleRoute') !== 'titleRoute'
    ? t9n(lang, 'titleRoute')
        .replace('{cidade}', airport.city)
        .replace('{destino}', dest.name)
        .replace('{preco}', money(p1))
    : `${airport.city} Airport to ${dest.name} Transfer | From ${money(p1)} | Airportlink`;
  const description = frase(lang, 'descRoute', {
      aeroporto: airport.name, destino: dest.name,
      min: dest.minutes, km: dest.km, preco: money(p1)
    }) ||
    `Private transfer from ${airport.name} to ${dest.name}: ${dest.minutes} minutes, ` +
    `${dest.km} km, from ${money(p1)} for up to 4 people. Fixed price, flight tracked, ` +
    `free cancellation up to 24 hours before.`;

  const faq = [
    [(frase(lang, 'qHowLong', { cidade: airport.city, destino: dest.name }) || `How long does it take to get from ${airport.city} Airport to ${dest.name}?`),
     (frase(lang, 'aHowLong', { min: dest.minutes, km: dest.km }) ||
      `About ${dest.minutes} minutes for the ${dest.km} km, outside peak traffic. ` +
      `Your driver knows the route and follows the flight, so a delayed landing moves the ` +
      `pick-up rather than costing you the transfer.`)],
    [(frase(lang, 'qHowMuch', { cidade: airport.city, destino: dest.name }) || `How much is a transfer from ${airport.city} Airport to ${dest.name}?`),
     (frase(lang, 'aHowMuch', { p1: money(p1), p5: money(p5) }) ||
      `From ${money(p1)} for up to four passengers, and ${money(p5)} for a group of five ` +
      `to eight in a van. The price is fixed when you book — tolls and taxes included, ` +
      `nothing added at the end.`)],
    [t9n(lang, 'What happens if my flight is late?'),
     (t9n(lang, 'aFlightLate') !== 'aFlightLate' ? t9n(lang, 'aFlightLate') :
      `We track the flight number you give us. The driver waits and adjusts to the actual ` +
      `landing time, with 60 minutes of free waiting after the plane touches down.`)],
    [(frase(lang, 'qWhereMeet', { cidade: airport.city, destino: dest.name }) || `Where do I meet the driver at ${airport.city} Airport?`),
     (t9n(lang, 'aWhereMeet') !== 'aWhereMeet' ? t9n(lang, 'aWhereMeet') :
      `In the arrivals hall after you clear customs. The day before your trip we send you ` +
      `the driver's name, phone number and vehicle, and they contact you with the exact spot.`)],
    [t9n(lang, 'Can I cancel?'),
     (t9n(lang, 'aCancel') !== 'aCancel' ? t9n(lang, 'aCancel') :
      `Free up to 24 hours before pick-up, refunded in full and automatically. On many ` +
      `routes you can also book without paying and we only charge the card 48 hours before ` +
      `you travel.`)]
  ];

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': url + '#service',
        name: `Airport transfer from ${airport.name} to ${dest.name}`,
        serviceType: 'Airport transfer',
        provider: { '@type': 'Organization', name: 'Airportlink', url: SITE + '/' },
        areaServed: { '@type': 'Place', name: `${dest.name}, ${pais(country, lang)}` },
        offers: {
          '@type': 'Offer',
          price: Math.round(p1),
          priceCurrency: country.currency,
          availability: 'https://schema.org/InStock',
          url
        }
      },
      {
        '@type': 'FAQPage',
        '@id': url + '#faq',
        mainEntity: faq.map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a }
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          // A raiz aponta sempre para SITE/ e não para /pt/ ou /fr/:
          // a homepage é uma só, traduzida no browser, e não existe
          // como página separada por língua.
          { '@type': 'ListItem', position: 1, name: t9n(lang, 'Home'), item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: airport.name,
            item: `${SITE}${pref}/airports/${cslug}/${slug}/` },
          { '@type': 'ListItem', position: 3, name: dest.name, item: url }
        ]
      }
    ]
  };

  const others = siblings
    .filter((d) => d.slug !== dest.slug)
    .slice(0, 6)
    .map((d) => {
      const price = priceEUR(d.km, 1, cc, slug, d.slug);
      return `<a class="other" href="${pref}/transfers/${cslug}/${slug}-to-${d.slug}/">` +
        `<b>${esc(d.name)}</b><span>${t9n(lang, 'from')} ${money(price)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema, lang, alternates }) + `
  <div class="crumb">
    <a href="/">Airportlink</a> &rsaquo;
    <a href="${pref}/airports/${cslug}/${slug}/">${esc(airport.name)}</a> &rsaquo;
    ${esc(dest.name)}
  </div>

  ${hero(airport, `${airport.iata} · ${pais(country, lang)}`,
         (frase(lang, 'h1Route', { cidade: airport.city, destino: dest.name }) || `${airport.city} Airport to ${dest.name}`))}


  ${calculator(airport, dest, cc, MAPS_KEY, lang)}

  <h2 id="included">${t9n(lang, 'What is included')}</h2>
  <ul class="ticks">
    ${[
      ['M5 17h14M7 17V9l3-4h4l3 4v8M9 5v4M15 5v4',
       t9n(lang, 'A private vehicle'), t9n(lang, 'for your group. No sharing, no other stops.')],
      ['M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
       t9n(lang, 'A fixed price'), t9n(lang, 'with tolls and taxes in. Nothing is added at the end.')],
      ['M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8l3.9 4.4-2.1 2.1-2.4-.6a.5.5 0 0 0-.5.8L5 16l1.3 2.2a.5.5 0 0 0 .8-.1l.6-2.4 2.1-2.1 4.4 3.9a.5.5 0 0 0 .8-.5Z',
       t9n(lang, 'Flight tracking.'), t9n(lang, 'Land late and the pick-up moves, not the price.')],
      ['M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
       t9n(lang, '60 minutes of free waiting'), t9n(lang, 'after the flight lands.')],
      ['M9 14l2 2 4-5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
       t9n(lang, 'Free cancellation'), t9n(lang, 'until 24 hours before pick-up.')],
      ['M6 8h12l1 12H5L6 8ZM9 8V6a3 3 0 0 1 6 0v2',
       t9n(lang, 'One suitcase and one bag per passenger.'), t9n(lang, 'More than that, tell us when you book.')]
    ].map(([d, t, rest]) => `<li>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="${d}"/></svg>
      <span><strong>${esc(t)}</strong> ${esc(rest)}</span>
    </li>`).join('')}
  </ul>

  <h2 id="journey">${t9n(lang, 'The journey')}</h2>
  <p>${esc(dest.about)}</p>

  <h2>${frase(lang, 'arriving', { aeroporto: esc(airport.name) }) || `Arriving at ${esc(airport.name)}`}</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  ${realTime(airport, dest, lang)}

  ${whenToBook(dest, lang)}

  ${localInfo(airport, lang)}

  <h2 id="faq">${t9n(lang, 'FAQ')}</h2>
  ${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n  <p>${esc(a)}</p>`).join('\n  ')}

  <h2 id="more">${frase(lang, 'otherFrom', { cidade: esc(airport.city) }) || `Other transfers from ${esc(airport.city)} Airport`}</h2>
  <div class="others">
      ${others}
  </div>
  <p style="margin-top:16px"><a href="${pref}/airports/${cslug}/${slug}/">${
    frase(lang, 'allTransfers', { cidade: esc(airport.city) })
    || `All ${esc(airport.city)} Airport transfers &rsaquo;`}</a></p>
` + foot;
}

// ============================================================
// PÁGINA DE AEROPORTO
// ============================================================

function airportPage(country, airport, lang, alternates) {
  lang = lang || 'en';
  const original = airport;
  airport = traduz(airport, lang) || airport;

  const cc = country.countryCode;
  const slug = slugOf(original);
  const cslug = countrySlug(country);
  const pref = (LANGS.find((l) => l.code === lang) || LANGS[0]).prefix;
  const url = `${SITE}${pref}/airports/${cslug}/${slug}/`;

  const cheapest = Math.min(...airport.destinations.map((d) => priceEUR(d.km, 1, cc, slug, d.slug)));

  const title = t9n(lang, 'titleAirport') !== 'titleAirport'
    ? t9n(lang, 'titleAirport')
        .replace('{cidade}', airport.city)
        .replace('{iata}', airport.iata)
        .replace('{preco}', money(cheapest))
    : `${airport.city} Airport Transfers (${airport.iata}) | From ${money(cheapest)} | Airportlink`;
  const description =
    `Private transfers from ${airport.name} to ${airport.destinations.length} destinations, ` +
    `from ${money(cheapest)}. Fixed prices, flight tracking and a driver waiting in arrivals.`;

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Airport',
        '@id': url + '#airport',
        name: airport.official || airport.name,
        iataCode: airport.iata,
        address: { '@type': 'PostalAddress', addressLocality: airport.city,
                   addressCountry: country.countryCode }
      },
      {
        '@type': 'ItemList',
        '@id': url + '#routes',
        name: (frase(lang, 'h1Airport', { aeroporto: airport.name }) || `Transfers from ${airport.name}`),
        itemListElement: airport.destinations.map((d, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `${airport.city} Airport to ${d.name}`,
          url: `${SITE}/transfers/${cslug}/${slug}-to-${d.slug}/`
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t9n(lang, 'Home'), item: SITE + '/' },
          { '@type': 'ListItem', position: 2, name: airport.name, item: url }
        ]
      }
    ]
  };

  const rows = airport.destinations
    .slice()
    .sort((a, b) => a.km - b.km)
    .map((d) => {
      const price = priceEUR(d.km, 1, cc, slug, d.slug);
      return `<a class="other" href="${pref}/transfers/${cslug}/${slug}-to-${d.slug}/">` +
        `<b>${esc(d.name)}</b>` +
        `<span>${esc(d.minutes)} min &middot; from ${money(price)}</span></a>`;
    }).join('\n      ');

  // Os outros aeroportos do mesmo país, para o Google perceber a
  // estrutura e para quem chegou ao aeroporto errado.
  const siblings = country.airports
    .filter((a) => a.iata !== airport.iata)
    .map((a) => {
      const s2 = slugOf(a);
      const from = Math.min(...a.destinations.map((d) => priceEUR(d.km, 1, cc, a.slug, d.slug)));
      return `<a class="other" href="${pref}/airports/${cslug}/${s2}/">` +
        `<b>${esc(a.name)}</b><span>from ${money(from)}</span></a>`;
    }).join('\n      ');

  return head({ title, description, canonical: url, schema, lang, alternates }) + `
  <div class="crumb"><a href="/">Airportlink</a> &rsaquo; ${esc(airport.name)}</div>

  ${hero(airport, `${airport.iata} \u00b7 ${pais(country, lang)}`,
         `${airport.name} transfers`)}


  <p class="lead">A private car from ${esc(airport.name)} to anywhere you are staying,
  at a price agreed before you fly. ${esc(airport.destinations.length)} routes below, and
  the calculator on the home page prices any address.</p>

  <h2 id="routes">${t9n(lang, 'Where people go')}</h2>
  <p>Prices are for one to four passengers, for the whole car. Larger groups travel in a van
  or minibus, which costs more but is still one fixed price for the group.</p>
  <div class="others">
      ${rows}
  </div>

  <div class="cta">
    <div>
      <strong>${t9n(lang, 'Going somewhere not on this list?')}</strong>
      <span>Enter the address and you have a price in seconds. We drive anywhere our
      partners cover.</span>
    </div>
    <a class="btn" href="/#book">${t9n(lang, 'Get a price')}</a>
  </div>

  ${localInfo(airport, lang)}

  <h2 id="airport">${t9n(lang, 'The airport')}</h2>
  <p>${esc(airport.about)}</p>
  ${airport.tips && airport.tips.length
    ? '<ul>' + airport.tips.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>'
    : ''}

  ${siblings ? `<h2>${frase(lang, 'otherAirports', { pais: esc(pais(country, lang)) }) || `Other airports in ${esc(pais(country, lang))}`}</h2>
  <div class="others">
      ${siblings}
  </div>` : ''}
` + foot;
}

// ============================================================
// GERAR
// ============================================================

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const files = fs.readdirSync(SEO_DIR).filter((f) => /^routes-[A-Z]{2}\.json$/.test(f));

if (!files.length) {
  console.error('No routes-XX.json found in seo/. Nothing to do.');
  process.exit(1);
}

ensure(OUT_TRANSFERS);
ensure(OUT_AIRPORTS);

const urls = [];
let routeCount = 0;

for (const file of files) {
  const country = JSON.parse(fs.readFileSync(path.join(SEO_DIR, file), 'utf8'));

  const cslug = countrySlug(country);

  // Uma pasta por país, dos dois lados.
  const transfersDir = path.join(OUT_TRANSFERS, cslug);
  const airportsDir = path.join(OUT_AIRPORTS, cslug);
  ensure(transfersDir);
  ensure(airportsDir);

  for (const airport of country.airports) {
    const slug = slugOf(airport);

    /**
     * As línguas em que este aeroporto tem tradução.
     *
     * Uma língua só entra se o aeroporto E o destino tiverem texto
     * traduzido. Meia página traduzida é pior do que nenhuma: o
     * Google vê texto duplicado e desconfia do conjunto.
     */
    const langsAeroporto = LANGS.filter((l) => traduz(airport, l.code));

    // Cada página é uma PASTA com um index.html lá dentro.
    //
    // É o que dá um endereço limpo sem depender de regra nenhuma:
    // qualquer servidor, ao receber um pedido para uma pasta, serve
    // o index.html que lá estiver. É a convenção mais antiga da web
    // e não há nada para configurar.
    //
    //   airports/portugal/faro/index.html
    //   /airports/portugal/faro
    // As alternativas deste aeroporto: uma entrada por língua em
    // que ele existe. Todas as versões recebem a mesma lista.
    const altAeroporto = langsAeroporto.map((l) => ({
      lang: l.code,
      url: `${SITE}${l.prefix}/airports/${cslug}/${slug}/`
    }));

    for (const l of langsAeroporto) {
      const dir = l.prefix
        ? path.join(ROOT, l.prefix.slice(1), 'airports', cslug, slug)
        : path.join(airportsDir, slug);
      ensure(dir);
      fs.writeFileSync(path.join(dir, 'index.html'),
        airportPage(country, airport, l.code, altAeroporto));
      urls.push({
        loc: `${SITE}${l.prefix}/airports/${cslug}/${slug}/`,
        priority: '0.8', freq: 'weekly', lang: l.code
      });
    }

    for (const dest of airport.destinations) {
      // A rota só existe numa língua se o aeroporto E o destino
      // estiverem traduzidos. O inglês está sempre.
      const langsRota = langsAeroporto.filter((l) => traduz(dest, l.code));

      const altRota = langsRota.map((l) => ({
        lang: l.code,
        url: `${SITE}${l.prefix}/transfers/${cslug}/${slug}-to-${dest.slug}/`
      }));

      for (const l of langsRota) {
        const folder = l.prefix
          ? path.join(ROOT, l.prefix.slice(1), 'transfers', cslug, `${slug}-to-${dest.slug}`)
          : path.join(transfersDir, `${slug}-to-${dest.slug}`);
        ensure(folder);
        fs.writeFileSync(path.join(folder, 'index.html'),
          routePage(country, airport, dest, airport.destinations, l.code, altRota));

        urls.push({
          loc: `${SITE}${l.prefix}/transfers/${cslug}/${slug}-to-${dest.slug}/`,
          priority: '0.7', freq: 'monthly', lang: l.code
        });
        routeCount += 1;
      }
    }
  }

  console.log(`${country.country}: ${country.airports.length} airports, ` +
              `${country.airports.reduce((t, a) => t + a.destinations.length, 0)} routes`);
}

// ---------- sitemap ----------
//
// As páginas fixas ficam no topo, as geradas por baixo. Reescrito
// por inteiro a cada geração: manter à mão com centenas de linhas
// era garantir que mais cedo ou mais tarde ficava desatualizado.

// A barra no fim é obrigatória nas pastas: o Render não a
// acrescenta sozinho, e sem ela a página vem em branco. O canonical
// e o sitemap têm de apontar para o endereço que funciona.
const fixed = [
  { loc: SITE + '/', priority: '1.0', freq: 'weekly' },
  { loc: SITE + '/travelagents', priority: '0.9', freq: 'monthly' },
  { loc: SITE + '/drivers', priority: '0.9', freq: 'monthly' },
  { loc: SITE + '/support', priority: '0.5', freq: 'monthly' },
  { loc: SITE + '/terms', priority: '0.3', freq: 'yearly' },
  { loc: SITE + '/privacypolicy', priority: '0.3', freq: 'yearly' },
  { loc: SITE + '/cookiepolicy', priority: '0.3', freq: 'yearly' },
  // Duas páginas de conta que passaram a ser indexáveis: a de
  // agências vende antes de pedir a password, e a de registo é
  // onde alguém que procura "criar conta transfer" aterra.
  { loc: SITE + '/agencylogin', priority: '0.7', freq: 'monthly' },
  { loc: SITE + '/createaccount', priority: '0.5', freq: 'monthly' }
];

// Um sitemap por país, mais um das páginas fixas, e um índice que
// os junta. O Search Console mostra a indexação de cada ficheiro em
// separado — quando Espanha entrar, vês logo se as páginas dela
// estão a ser apanhadas sem misturar com Portugal.
function urlsetXml(list) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Gerado por seo/build-routes.js. Não editar à mão. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${list.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

// as urls geradas, agrupadas pelo país que vem no caminho
const byCountry = {};
for (const u of urls) {
  const m = u.loc.match(/\/(?:transfers|airports)\/([a-z-]+)\//);
  const cc = m ? m[1] : 'other';
  (byCountry[cc] = byCountry[cc] || []).push(u);
}

// Os filhos vivem em /sitemaps/, o índice fica na raiz. A regra do
// protocolo que prende um sitemap à sua pasta não se aplica quando
// ele é submetido pelo Search Console ou referido no robots.txt —
// e o nosso índice está nos dois.
const SM_DIR = path.join(ROOT, 'sitemaps');
fs.mkdirSync(SM_DIR, { recursive: true });

fs.writeFileSync(path.join(SM_DIR, 'static.xml'), urlsetXml(fixed));

const parts = ['sitemaps/static.xml'];

// O blogue tem sitemap próprio, escrito pelo build-blog.js. Entra
// no índice se existir, para se poder acompanhar à parte no
// Search Console — o blogue indexa a ritmo diferente das rotas.
if (fs.existsSync(path.join(ROOT, 'sitemaps/blog.xml'))) {
  parts.push('sitemaps/blog.xml');
}
for (const [cc, list] of Object.entries(byCountry)) {
  const name = `${cc}.xml`;
  fs.writeFileSync(path.join(SM_DIR, name), urlsetXml(list));
  parts.push('sitemaps/' + name);
}

const index = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Índice: um sitemap por país + um das páginas fixas. -->
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${parts.map((n) => `  <sitemap>
    <loc>${SITE}/${n}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), index);

console.log(`\n${routeCount} route pages, ${urls.length - routeCount} airport pages.`);
console.log(`sitemap.xml rewritten with ${fixed.length + urls.length} URLs.`);
console.log('\nNext: commit and push. Then submit the sitemap in Search Console.');
