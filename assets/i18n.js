/**
 * Traduções do site.
 *
 * As páginas de reserva e checkout são passos de um fluxo, não
 * conteúdo indexável — têm noindex. Por isso a tradução acontece no
 * browser: manter três cópias de cada ficheiro HTML significaria
 * corrigir cada bug três vezes, e mais cedo ou mais tarde as cópias
 * divergiriam.
 *
 * As páginas de rota são o contrário: existem para o Google. Essas
 * são geradas uma por língua, com endereço próprio, pelo
 * seo/build-routes.js.
 *
 * COMO USAR
 *   <span data-i18n="book.continue">Continue</span>
 *   <input data-i18n-ph="book.namePlaceholder">
 *   <button data-i18n-aria="nav.close">
 *
 * O texto em inglês fica no HTML e serve de fallback: se uma chave
 * faltar, a página mostra inglês em vez de mostrar a chave.
 */
(function () {
  'use strict';

  var DICT = {
    es: {
      // ---------- comum ----------
      'common.from': 'Desde',
      'common.to': 'Hasta',
      'common.pickup': 'Recogida',
      'common.dropoff': 'Destino',
      'common.date': 'Fecha',
      'common.time': 'Hora',
      'common.passengers': 'Pasajeros',
      'common.passenger': 'pasajero',
      'common.passengersPlural': 'pasajeros',
      'common.continue': 'Continuar',
      'common.change': 'Cambiar',
      'common.done': 'Listo',
      'common.back': 'Atrás',
      'common.total': 'Total',
      'common.included': 'Incluido',
      'common.seats': 'plazas',
      'common.suitcases': 'maletas',
      'common.vehicles': 'vehículos',
      'common.km': 'km',

      // ---------- reserva ----------
      'book.title': 'Elige tu vehículo',
      'book.working': 'Calculando tus opciones',
      'book.measuring': 'Midiendo la ruta',
      'book.noRoute': 'No hemos encontrado esa ruta',
      'book.noRouteHelp': 'Revisa cómo has escrito las dos direcciones, o prueba con el nombre del pueblo en lugar del hotel.',
      'book.needBoth': 'Necesitamos los dos extremos del viaje',
      'book.needBothHelp': 'Pulsa Cambiar arriba y dinos a dónde vas.',
      'book.noService': 'No hemos podido contactar con el servicio de mapas',
      'book.noServiceHelp': 'Recarga la página o usa la calculadora de la página principal.',
      'book.updating': 'Actualizando tu precio',
      'book.addReturn': 'Añadir vuelta',
      'book.returnAdded': 'Vuelta añadida',
      'book.returnDate': 'Fecha de vuelta',
      'book.returnTime': 'Hora de vuelta',
      'book.returnNote': 'Mismo vehículo, mismo precio. Cada trayecto se puede cancelar por separado.',
      'book.yourBooking': 'Tu reserva',
      'book.vehicle': 'Vehículo',
      'book.outbound': 'Ida',
      'book.return': 'Vuelta',
      'book.wholeVehicle': 'vehículo completo',
      'book.bestFit': 'Mejor opción',
      'book.payLater': 'Reserva ahora, paga el',
      'book.chargedAtCheckout': 'A menos de 48 horas — se cobra al confirmar',
      'book.notEnoughSeats': 'No hay plazas suficientes para',

      // as classes
      'veh.sedan': 'Sedán',
      'veh.premium': 'Sedán Premium',
      'veh.van': 'Furgoneta',
      'veh.van_sedan': 'Furgoneta + Sedán',
      'veh.two_vans': 'Dos furgonetas',
      'veh.sedan.note': 'Un turismo cómodo. Lo que reserva la mayoría.',
      'veh.premium.note': 'Un turismo ejecutivo más amplio — más espacio para las piernas y para el equipaje.',
      'veh.van.note': 'Una monovolumen. También la opción acertada para cuatro personas con mucho equipaje.',
      'veh.van_sedan.note': 'Dos vehículos, dos conductores. Viajan juntos y llegan juntos.',
      'veh.two_vans.note': 'Dos monovolúmenes para un grupo grande. Una reserva, un precio.',

      // as garantias
      'trust.freeCancel': 'Cancelación gratuita',
      'trust.freeCancelText': 'hasta 24 horas antes de la recogida, con reembolso completo.',
      'trust.noCharge': 'Hoy no se cobra nada',
      'trust.noChargeText': 'en la mayoría de rutas. Lo cobramos 48 horas antes.',
      'trust.flight': 'Seguimos tu vuelo.',
      'trust.flightText': 'Si aterrizas tarde, el conductor te espera igualmente, sin coste añadido.',
      'trust.licensed': 'Empresas locales con licencia.',
      'trust.licensedText': 'Comprobamos la licencia y el seguro.',

      // ---------- checkout ----------
      'co.secure': 'Pago seguro',
      'co.stepRoute': 'Ruta',
      'co.stepVehicle': 'Vehículo',
      'co.stepDetails': 'Tus datos',
      'co.stepPayment': 'Pago',
      'co.bookedBefore': '¿Has reservado antes con nosotros?',
      'co.bookedBeforeText': 'Inicia sesión y tus datos se rellenan solos.',
      'co.signIn': 'Iniciar sesión',
      'co.createAccount': 'Crear cuenta',
      'co.guest': 'Continuar como invitado',
      'co.guestTitle': 'Continuando como invitado',
      'co.guestText': 'Creamos tu cuenta después de la reserva, para que puedas ver el viaje más tarde. No hace falta contraseña ahora.',
      'co.who': 'Quién viaja',
      'co.whoText': 'El conductor recibe el nombre y el teléfono el día antes, y nada más.',
      'co.fullName': 'Nombre completo',
      'co.email': 'Correo electrónico',
      'co.emailHint': 'Aquí llegan tu confirmación y los datos del conductor.',
      'co.phone': 'Teléfono',
      'co.phoneHint': 'El conductor llama o escribe a este número el día del viaje.',
      'co.journey': 'El viaje',
      'co.journeyText': 'Cuanto más exacta sea la dirección, menos llamadas el día del viaje.',
      'co.flight': 'Número de vuelo',
      'co.optional': 'opcional',
      'co.flightHint': 'Lo seguimos. Si aterrizas tarde, el conductor espera y no pagas nada extra.',
      'co.pickupAddress': 'Dirección de recogida',
      'co.dropoffAddress': 'Dirección de destino',
      'co.dropoffHint': 'Nombre del hotel y calle. No solo el pueblo.',
      'co.notes': 'Algo que debamos saber',
      'co.notesPlaceholder': 'Sillas infantiles, equipaje extra, una silla de ruedas, una segunda parada — dínoslo aquí y lo organizamos.',
      'co.notesHint': 'Las sillas infantiles son gratis. Solo dinos las edades.',
      'co.howPay': 'Cómo quieres pagar',
      'co.howPayText': 'En ambos casos, la cancelación es gratuita hasta 24 horas antes de la recogida.',
      'co.payLater': 'Pagar después',
      'co.payLaterDesc': 'Guardamos la tarjeta ahora y la cobramos el',
      'co.payLaterDesc2': '— 48 horas antes de viajar.',
      'co.payLaterNo': 'Tu traslado es en menos de 48 horas, así que no hay un después que esperar.',
      'co.payNow': 'Pagar ahora',
      'co.payNowDesc': 'Págalo hoy y olvídate.',
      'co.yourTransfer': 'Tu traslado',
      'co.when': 'Cuándo',
      'co.transfer': 'Traslado',
      'co.tolls': 'Peajes e impuestos',
      'co.waiting': 'Tiempo de espera',
      'co.confirm': 'Confirmar reserva',
      'co.terms': 'Al confirmar aceptas nuestros',
      'co.termsLink': 'términos',
      'co.and': 'y la',
      'co.privacyLink': 'política de privacidad',
      'co.termsEnd': 'El precio se recalcula en nuestros servidores antes del pago, así que lo que ves es lo que se cobra.',
      'co.editVehicle': 'Editar',
      'co.fixFields': 'Hay un par de campos que corregir antes de continuar.',
      'co.errName': 'Necesitamos un nombre para que el conductor te busque.',
      'co.errEmail': 'Ese correo no parece correcto.',
      'co.errPhone': 'Necesitamos un número al que el conductor pueda llamar.',
      'co.errDropoff': 'Necesitamos un sitio donde dejarte.',
      'co.charged': 'Se cobra hoy',
      'co.password': 'Contraseña',
      'co.signedInAs': 'Sesión iniciada como',
      'co.signedInText': 'Tus datos están rellenados abajo. Esta reserva aparecerá en tu cuenta.',
      'co.swapToSignup': 'Prefiero crear una cuenta',
      'co.swapToSignin': 'Ya tengo una cuenta',

      // ---------- pagina inicial ----------
      'h.tag': 'Traslados privados de aeropuerto',
      'h.title1': 'Un conductor esperándote,',
      'h.title2': 'a un precio que ya conoces.',
      'h.lead': 'Sin colas, sin taxímetro, sin sorpresas. Un vehículo para tu grupo, puerta a puerta.',
      'h.badge1': 'Precio fijo, impuestos incluidos',
      'h.badge2': 'Cancelación gratuita, 24 h',
      'h.badge3': 'Hasta 16 personas',
      'h.badge4': 'Pago con Stripe',
      'h.badge5': 'Reserva ahora, paga después',
      'h.getFare': 'Consulta tu precio',
      'h.getFareText': 'Introduce la ruta y la hora. El precio se calcula sobre la ruta real por carretera, no sobre una estimación.',
      'h.freeCancel': 'Cancelación gratuita hasta 24 horas antes de la recogida, con reembolso completo desde tu cuenta.',
      'h.partnerRate': 'Tarifa de socio aplicada',
      'h.currency': 'Moneda',
      'h.auto': 'Automático',
      'h.whereCollect': 'Dónde te recogemos',
      'h.yourDest': 'Tu destino',
      'h.pickupTime': 'Hora de recogida',
      'h.sedanNote': 'Hasta 4 pasajeros con equipaje de mano.',
      'h.comingBack': '¿Vuelves también?',
      'h.comingBackT': 'Añade la vuelta y paga las dos de una vez.',
      'h.retElsewhere': 'Recogida en otro sitio a la vuelta',
      'h.retPickup': 'Recogida de vuelta',
      'h.retDropoff': 'Destino de vuelta',
      'h.retRemove': 'Quitar la vuelta',
      'h.distance': 'Distancia',
      'h.duration': 'Duración',
      'h.price': 'Precio',
      'h.payNowNote': 'La tarjeta se cobra hoy. Cancelación gratuita hasta 24 horas antes de la recogida.',
      'h.notAvailable': 'No disponible',
      'h.payLaterNote': 'Guardamos la tarjeta y no cobramos nada hasta 48 horas antes de la recogida.',
      'h.cardWhat': 'Qué pasa con tu tarjeta.',
      'h.tripDetails': 'Detalles del viaje',
      'h.tellUs': 'Dinos a dónde vas y te mostramos los vehículos.',
      'h.signInCont': 'Inicia sesión para continuar',
      'h.forgotPass': '¿Olvidaste tu contraseña?',
      'h.noAccount': 'Reservar sin cuenta',
      'h.bookingAs': 'Reservando como',
      'h.notYou': '¿No eres tú?',
      'h.signInInstead': 'Iniciar sesión',
      'h.required': 'Obligatorio',
      'h.emailNote': 'Aquí llegan tu confirmación, el recibo y los datos del conductor.',
      'h.fromAccount': 'Desde tu cuenta',
      'h.savedTrav': 'Viajero guardado',
      'h.optional': 'Opcional',
      'h.newTrav': 'Nuevo viajero',
      'h.yourRef': 'Tu referencia',
      'h.paxEmail': 'Correo del pasajero',
      'h.phoneNote': 'El conductor llama a este número si no te encuentra el día del viaje.',
      'h.flightNote': 'Dinos el vuelo y lo seguimos. Si aterriza tarde, el conductor espera.',
      'h.notes': 'Notas',
      'h.saveTrav': 'Guardar este viajero para la próxima vez',
      'h.reviewBooking': 'Revisar la reserva',
      'h.liveRoute': 'Ruta en directo',
      'h.drivingDist': 'Distancia por carretera',
      'h.checkBooking': 'Comprueba tu reserva',
      'h.checkNote': 'Todo lo de abajo es lo que recibe el conductor. Cambia lo que quieras arriba antes de pagar.',
      'h.flight': 'Vuelo',
      'h.returnTrip': 'Viaje de vuelta',
      'h.payment': 'Pago',
      'h.cancelNote': 'Puedes cancelar esta reserva gratis hasta 24 horas antes de la recogida, desde tu cuenta.',
      'h.payConfirm': 'Pagar y confirmar',
      'h.next': 'Qué pasa después',
      'h.nextTitle': 'Del aterrizaje a tu puerta.',
      'h.nextLead': 'Después de reservar pasan tres cosas. Ninguna necesita nada de ti.',
      'h.step1': 'Paso uno',
      'h.step2': 'Paso dos',
      'h.step3': 'Paso tres',
      'h.step4': 'Paso cuatro',
      'h.s1t': 'Tu vuelo aterriza',
      'h.s1b': 'Lo seguimos con el número de vuelo que nos diste. Si aterrizas dos horas tarde, la recogida se mueve sin más.',
      'h.s2b': 'Tienes su nombre y su teléfono desde el día anterior. Te llama con el punto de encuentro exacto.',
      'h.s3t': 'Directo a tu puerta',
      'h.s3b': 'Un vehículo para tu grupo, sin más paradas. El precio que viste es el que pagaste.',
      'h.where': 'Dónde conducimos',
      'h.whereTitle': 'Los sitios donde aterrizan nuestros pasajeros.',
      'h.howWorks': 'Cómo funciona',
      'h.howTitle': 'Del presupuesto a la confirmación, en cuatro pasos.',
      'h.howLead': 'Sin llamadas y sin esperar a que alguien te envíe un precio por correo.',
      'h.h1t': 'Introduce tu ruta',
      'h.h1b': 'Punto de recogida, destino, fecha y hora. Usamos la ruta real por carretera, así que la distancia es la de verdad.',
      'h.h2t': 'Consulta el precio',
      'h.h2b': 'El precio aparece de inmediato, en tu moneda y con todo incluido.',
      'h.h3t': 'Añade tus datos',
      'h.h3b': 'Nombre, teléfono y, si aterrizas, el número de vuelo. Eso es lo que llega al conductor.',
      'h.h4t': 'Paga y olvídate',
      'h.h4b': 'Stripe se encarga de la tarjeta. Tu reserva, el recibo y el botón de cancelar están en tu cuenta.',
      'h.questions': 'Preguntas',
      'h.qTitle': 'Antes de reservar.',
      'h.fAll': 'Todas',
      'h.fBooking': 'Reserva',
      'h.fService': 'Servicio',
      'h.fPricing': 'Precios',
      'h.noMatch': 'Sin resultados. Prueba con palabras como cancelar, vuelo, precio o equipaje.',
      'h.agencyT': '¿Reservas para otra persona?',
      'h.agencyB': 'Las agencias de viajes obtienen tarifa profesional en cada traslado, un plazo de cancelación más largo y una factura mensual.',
      'h.agencyCta': 'Programa para agencias',
      'h.q1': '¿Puedo cancelar mi reserva?',
      'h.a1': 'Sí. La cancelación es gratuita hasta 24 horas antes de la hora de recogida y el reembolso es completo.',
      'h.q2': '¿Y si mi vuelo se retrasa?',
      'h.a2': 'Añade el número de vuelo al reservar. Seguimos la llegada y ajustamos la recogida.',
      'h.q3': '¿El vehículo es solo para nosotros?',
      'h.a3': 'Sí. Todos los traslados son privados. Nunca compartes el vehículo con otros pasajeros.',
      'h.q4': '¿Vais hasta mi dirección?',
      'h.a4': 'Sí. El trayecto va directo entre el punto de recogida y el destino que introduzcas.',
      'h.q5': '¿Podéis llevar a un grupo?',
      'h.a5': 'Hasta 16 pasajeros. El tipo de vehículo se ajusta solo al cambiar el número.',
      'h.q6': '¿El precio es realmente final?',
      'h.a6': 'Sí. Impuestos y peajes están incluidos y no hay taxímetro. El precio se recalcula en nuestros servidores antes del pago.',
      'h.q7': '¿Puedo pagar en mi moneda?',
      'h.a7': 'Hay dieciséis monedas disponibles y sugerimos una según tu ubicación.',
      'h.q8': '¿Por qué necesito una cuenta?',
      'h.a8': 'Para poder encontrar la reserva otra vez. Guarda los datos del viaje y el recibo en un solo sitio.',
      'h.q9': '¿Es seguro pagar?',
      'h.a9': 'El pago va a través de Stripe Checkout. Los datos de tu tarjeta nunca pasan por nuestros servidores.',
      'h.s2t': 'Tu conductor ya está allí',
    },

    de: {
      // ---------- comum ----------
      'common.from': 'Von',
      'common.to': 'Nach',
      'common.pickup': 'Abholung',
      'common.dropoff': 'Ziel',
      'common.date': 'Datum',
      'common.time': 'Uhrzeit',
      'common.passengers': 'Passagiere',
      'common.passenger': 'Passagier',
      'common.passengersPlural': 'Passagiere',
      'common.continue': 'Weiter',
      'common.change': 'Ändern',
      'common.done': 'Fertig',
      'common.back': 'Zurück',
      'common.total': 'Gesamt',
      'common.included': 'Inklusive',
      'common.seats': 'Sitzplätze',
      'common.suitcases': 'Koffer',
      'common.vehicles': 'Fahrzeuge',
      'common.km': 'km',

      // ---------- reserva ----------
      'book.title': 'Wählen Sie Ihr Fahrzeug',
      'book.working': 'Wir berechnen Ihre Optionen',
      'book.measuring': 'Route wird berechnet',
      'book.noRoute': 'Diese Route haben wir nicht gefunden',
      'book.noRouteHelp': 'Prüfen Sie die Schreibweise beider Adressen, oder nehmen Sie den Ortsnamen statt des Hotels.',
      'book.needBoth': 'Wir brauchen Start und Ziel',
      'book.needBothHelp': 'Klicken Sie oben auf Ändern und sagen Sie uns, wohin es geht.',
      'book.noService': 'Der Kartendienst war nicht erreichbar',
      'book.noServiceHelp': 'Laden Sie die Seite neu oder nutzen Sie den Rechner auf der Startseite.',
      'book.updating': 'Preis wird aktualisiert',
      'book.addReturn': 'Rückfahrt hinzufügen',
      'book.returnAdded': 'Rückfahrt hinzugefügt',
      'book.returnDate': 'Datum der Rückfahrt',
      'book.returnTime': 'Uhrzeit der Rückfahrt',
      'book.returnNote': 'Gleiches Fahrzeug, gleicher Preis. Jede Fahrt lässt sich einzeln stornieren.',
      'book.yourBooking': 'Ihre Buchung',
      'book.vehicle': 'Fahrzeug',
      'book.outbound': 'Hinfahrt',
      'book.return': 'Rückfahrt',
      'book.wholeVehicle': 'ganzes Fahrzeug',
      'book.bestFit': 'Beste Wahl',
      'book.payLater': 'Jetzt buchen, zahlen am',
      'book.chargedAtCheckout': 'Weniger als 48 Stunden — Zahlung bei der Buchung',
      'book.notEnoughSeats': 'Nicht genug Sitzplätze für',

      'veh.sedan': 'Limousine',
      'veh.premium': 'Premium-Limousine',
      'veh.van': 'Van',
      'veh.van_sedan': 'Van + Limousine',
      'veh.two_vans': 'Zwei Vans',
      'veh.sedan.note': 'Eine bequeme Limousine. Was die meisten buchen.',
      'veh.premium.note': 'Eine größere Business-Limousine — mehr Beinfreiheit und mehr Kofferraum.',
      'veh.van.note': 'Ein Van. Auch die richtige Wahl für vier Personen mit viel Gepäck.',
      'veh.van_sedan.note': 'Zwei Fahrzeuge, zwei Fahrer. Sie fahren zusammen und kommen zusammen an.',
      'veh.two_vans.note': 'Zwei Vans für eine große Gruppe. Eine Buchung, ein Preis.',

      'trust.freeCancel': 'Kostenlose Stornierung',
      'trust.freeCancelText': 'bis 24 Stunden vor der Abholung, mit voller Rückerstattung.',
      'trust.noCharge': 'Heute wird nichts abgebucht',
      'trust.noChargeText': 'auf den meisten Strecken. Wir buchen 48 Stunden vorher ab.',
      'trust.flight': 'Wir verfolgen Ihren Flug.',
      'trust.flightText': 'Bei Verspätung wartet der Fahrer trotzdem, ohne Aufpreis.',
      'trust.licensed': 'Lizenzierte lokale Unternehmen.',
      'trust.licensedText': 'Wir prüfen Lizenz und Versicherung.',

      // ---------- checkout ----------
      'co.secure': 'Sichere Zahlung',
      'co.stepRoute': 'Route',
      'co.stepVehicle': 'Fahrzeug',
      'co.stepDetails': 'Ihre Daten',
      'co.stepPayment': 'Zahlung',
      'co.bookedBefore': 'Schon einmal bei uns gebucht?',
      'co.bookedBeforeText': 'Melden Sie sich an und Ihre Daten füllen sich von selbst.',
      'co.signIn': 'Anmelden',
      'co.createAccount': 'Konto erstellen',
      'co.guest': 'Als Gast fortfahren',
      'co.guestTitle': 'Sie fahren als Gast fort',
      'co.guestText': 'Wir legen Ihr Konto nach der Buchung an, damit Sie die Fahrt später sehen können. Jetzt ist kein Passwort nötig.',
      'co.who': 'Wer reist',
      'co.whoText': 'Der Fahrer erhält am Vortag Namen und Telefonnummer, sonst nichts.',
      'co.fullName': 'Vollständiger Name',
      'co.email': 'E-Mail',
      'co.emailHint': 'Hierhin gehen Ihre Bestätigung und die Daten des Fahrers.',
      'co.phone': 'Telefon',
      'co.phoneHint': 'Der Fahrer ruft am Tag der Fahrt unter dieser Nummer an.',
      'co.journey': 'Die Fahrt',
      'co.journeyText': 'Je genauer die Adresse, desto weniger Anrufe am Tag der Fahrt.',
      'co.flight': 'Flugnummer',
      'co.optional': 'optional',
      'co.flightHint': 'Wir verfolgen ihn. Bei Verspätung wartet der Fahrer, ohne Aufpreis.',
      'co.pickupAddress': 'Abholadresse',
      'co.dropoffAddress': 'Zieladresse',
      'co.dropoffHint': 'Hotelname und Straße. Nicht nur der Ort.',
      'co.notes': 'Sollten wir etwas wissen?',
      'co.notesPlaceholder': 'Kindersitze, zusätzliches Gepäck, ein Rollstuhl, ein zweiter Halt — sagen Sie es uns und wir kümmern uns darum.',
      'co.notesHint': 'Kindersitze sind kostenlos. Nennen Sie uns nur das Alter.',
      'co.howPay': 'Wie möchten Sie zahlen',
      'co.howPayText': 'In beiden Fällen ist die Stornierung bis 24 Stunden vor der Abholung kostenlos.',
      'co.payLater': 'Später zahlen',
      'co.payLaterDesc': 'Karte jetzt hinterlegen, Abbuchung am',
      'co.payLaterDesc2': '— 48 Stunden vor der Fahrt.',
      'co.payLaterNo': 'Ihr Transfer ist in weniger als 48 Stunden, es gibt also kein Später mehr.',
      'co.payNow': 'Jetzt zahlen',
      'co.payNowDesc': 'Heute bezahlen und nicht mehr daran denken.',
      'co.yourTransfer': 'Ihr Transfer',
      'co.when': 'Wann',
      'co.transfer': 'Transfer',
      'co.tolls': 'Maut und Steuern',
      'co.waiting': 'Wartezeit',
      'co.confirm': 'Buchung bestätigen',
      'co.terms': 'Mit der Bestätigung akzeptieren Sie unsere',
      'co.termsLink': 'AGB',
      'co.and': 'und die',
      'co.privacyLink': 'Datenschutzerklärung',
      'co.termsEnd': 'Der Preis wird vor der Zahlung auf unseren Servern neu berechnet — was Sie sehen, wird auch abgebucht.',
      'co.editVehicle': 'Bearbeiten',
      'co.fixFields': 'Ein paar Felder müssen noch korrigiert werden.',
      'co.errName': 'Wir brauchen einen Namen, nach dem der Fahrer sucht.',
      'co.errEmail': 'Diese E-Mail sieht nicht richtig aus.',
      'co.errPhone': 'Wir brauchen eine Nummer, unter der der Fahrer Sie erreicht.',
      'co.errDropoff': 'Wir brauchen ein Ziel.',
      'co.charged': 'Heute abgebucht',
      'co.password': 'Passwort',
      'co.signedInAs': 'Angemeldet als',
      'co.signedInText': 'Ihre Daten sind unten eingetragen. Diese Buchung erscheint in Ihrem Konto.',
      'co.swapToSignup': 'Lieber ein Konto erstellen',
      'co.swapToSignin': 'Ich habe schon ein Konto',

      // ---------- pagina inicial ----------
      'h.tag': 'Private Flughafentransfers',
      'h.title1': 'Ein Fahrer wartet auf Sie,',
      'h.title2': 'zu einem Preis, den Sie schon kennen.',
      'h.lead': 'Keine Schlangen, kein Taxameter, keine Überraschungen. Ein Fahrzeug für Ihre Gruppe, von Tür zu Tür.',
      'h.badge1': 'Festpreis, Steuern inklusive',
      'h.badge2': 'Kostenlose Stornierung, 24 Std.',
      'h.badge3': 'Bis zu 16 Personen',
      'h.badge4': 'Zahlung über Stripe',
      'h.badge5': 'Jetzt buchen, später zahlen',
      'h.getFare': 'Preis berechnen',
      'h.getFareText': 'Geben Sie Route und Uhrzeit ein. Der Preis wird auf der tatsächlichen Fahrstrecke berechnet, nicht geschätzt.',
      'h.freeCancel': 'Kostenlose Stornierung bis 24 Stunden vor der Abholung, volle Rückerstattung über Ihr Konto.',
      'h.partnerRate': 'Partnertarif angewendet',
      'h.currency': 'Währung',
      'h.auto': 'Automatisch',
      'h.whereCollect': 'Wo wir Sie abholen',
      'h.yourDest': 'Ihr Ziel',
      'h.pickupTime': 'Abholzeit',
      'h.sedanNote': 'Bis zu 4 Passagiere mit Handgepäck.',
      'h.comingBack': 'Auch zurück?',
      'h.comingBackT': 'Fügen Sie die Rückfahrt hinzu und zahlen Sie beides auf einmal.',
      'h.retElsewhere': 'Rückfahrt ab einem anderen Ort',
      'h.retPickup': 'Abholung Rückfahrt',
      'h.retDropoff': 'Ziel Rückfahrt',
      'h.retRemove': 'Rückfahrt entfernen',
      'h.distance': 'Entfernung',
      'h.duration': 'Dauer',
      'h.price': 'Preis',
      'h.payNowNote': 'Die Karte wird heute belastet. Kostenlose Stornierung bis 24 Stunden vor der Abholung.',
      'h.notAvailable': 'Nicht verfügbar',
      'h.payLaterNote': 'Karte hinterlegt, Abbuchung erst 48 Stunden vor der Abholung.',
      'h.cardWhat': 'Was mit Ihrer Karte geschieht.',
      'h.tripDetails': 'Fahrtdetails',
      'h.tellUs': 'Sagen Sie uns, wohin es geht, und wir zeigen Ihnen die Fahrzeuge.',
      'h.signInCont': 'Zum Fortfahren anmelden',
      'h.forgotPass': 'Passwort vergessen?',
      'h.noAccount': 'Ohne Konto buchen',
      'h.bookingAs': 'Buchung als',
      'h.notYou': 'Nicht Sie?',
      'h.signInInstead': 'Stattdessen anmelden',
      'h.required': 'Erforderlich',
      'h.emailNote': 'Hierhin gehen Ihre Bestätigung, die Rechnung und die Daten des Fahrers.',
      'h.fromAccount': 'Aus Ihrem Konto',
      'h.savedTrav': 'Gespeicherter Reisender',
      'h.optional': 'Optional',
      'h.newTrav': 'Neuer Reisender',
      'h.yourRef': 'Ihre Referenz',
      'h.paxEmail': 'E-Mail des Passagiers',
      'h.phoneNote': 'Der Fahrer ruft hier an, wenn er Sie am Tag nicht findet.',
      'h.flightNote': 'Nennen Sie uns den Flug und wir verfolgen ihn. Bei Verspätung wartet der Fahrer.',
      'h.notes': 'Anmerkungen',
      'h.saveTrav': 'Diesen Reisenden für das nächste Mal speichern',
      'h.reviewBooking': 'Buchung prüfen',
      'h.liveRoute': 'Route live',
      'h.drivingDist': 'Fahrstrecke',
      'h.checkBooking': 'Prüfen Sie Ihre Buchung',
      'h.checkNote': 'Alles unten erhält der Fahrer. Ändern Sie oben, was Sie möchten, bevor Sie zahlen.',
      'h.flight': 'Flug',
      'h.returnTrip': 'Rückfahrt',
      'h.payment': 'Zahlung',
      'h.cancelNote': 'Sie können diese Buchung bis 24 Stunden vor der Abholung kostenlos über Ihr Konto stornieren.',
      'h.payConfirm': 'Zahlen und bestätigen',
      'h.next': 'Was als Nächstes passiert',
      'h.nextTitle': 'Von der Landung bis vor Ihre Tür.',
      'h.nextLead': 'Nach der Buchung geschehen drei Dinge. Keines davon erfordert etwas von Ihnen.',
      'h.step1': 'Schritt eins',
      'h.step2': 'Schritt zwei',
      'h.step3': 'Schritt drei',
      'h.step4': 'Schritt vier',
      'h.s1t': 'Ihr Flug landet',
      'h.s1b': 'Wir verfolgen ihn über die Flugnummer. Landen Sie zwei Stunden später, verschiebt sich die Abholung einfach.',
      'h.s2b': 'Sie hatten Namen und Telefonnummer schon am Vortag. Der Fahrer nennt Ihnen den genauen Treffpunkt.',
      'h.s3t': 'Direkt vor Ihre Tür',
      'h.s3b': 'Ein Fahrzeug für Ihre Gruppe, ohne weitere Halte. Der Preis, den Sie sahen, ist der, den Sie zahlten.',
      'h.where': 'Wohin wir fahren',
      'h.whereTitle': 'Die Orte, an denen unsere Passagiere landen.',
      'h.howWorks': 'So funktioniert es',
      'h.howTitle': 'Vom Angebot zur Bestätigung, in vier Schritten.',
      'h.howLead': 'Keine Anrufe, kein Warten auf einen Preis per E-Mail.',
      'h.h1t': 'Route eingeben',
      'h.h1b': 'Abholort, Ziel, Datum und Uhrzeit. Wir nutzen die tatsächliche Fahrstrecke, die Entfernung stimmt also.',
      'h.h2t': 'Preis ansehen',
      'h.h2b': 'Der Preis erscheint sofort, in Ihrer Währung und mit allem inklusive.',
      'h.h3t': 'Ihre Daten hinzufügen',
      'h.h3b': 'Name, Telefon und, wenn Sie landen, die Flugnummer. Das erhält der Fahrer.',
      'h.h4t': 'Zahlen und vergessen',
      'h.h4b': 'Stripe übernimmt die Karte. Buchung, Rechnung und Storno-Schaltfläche liegen in Ihrem Konto.',
      'h.questions': 'Fragen',
      'h.qTitle': 'Bevor Sie buchen.',
      'h.fAll': 'Alle',
      'h.fBooking': 'Buchung',
      'h.fService': 'Service',
      'h.fPricing': 'Preise',
      'h.noMatch': 'Nichts gefunden. Versuchen Sie Wörter wie stornieren, Flug, Preis oder Gepäck.',
      'h.agencyT': 'Buchen Sie für jemand anderen?',
      'h.agencyB': 'Reisebüros erhalten einen Händlertarif für jeden Transfer, eine längere Stornofrist und eine Monatsabrechnung.',
      'h.agencyCta': 'Programm für Reisebüros',
      'h.q1': 'Kann ich meine Buchung stornieren?',
      'h.a1': 'Ja. Die Stornierung ist bis 24 Stunden vor der Abholzeit kostenlos und die Rückerstattung erfolgt vollständig.',
      'h.q2': 'Was, wenn mein Flug Verspätung hat?',
      'h.a2': 'Geben Sie bei der Buchung die Flugnummer an. Wir verfolgen die Ankunft und passen die Abholung an.',
      'h.q3': 'Ist das Fahrzeug nur für uns?',
      'h.a3': 'Ja. Jeder Transfer ist privat. Sie teilen das Fahrzeug nie mit anderen Passagieren.',
      'h.q4': 'Fahren Sie bis zu meiner Adresse?',
      'h.a4': 'Ja. Die Fahrt führt direkt vom Abholort zum von Ihnen angegebenen Ziel.',
      'h.q5': 'Können Sie eine Gruppe befördern?',
      'h.a5': 'Bis zu 16 Passagiere. Der Fahrzeugtyp passt sich automatisch an die Anzahl an.',
      'h.q6': 'Ist der Preis wirklich endgültig?',
      'h.a6': 'Ja. Steuern und Maut sind inklusive und es gibt kein Taxameter. Der Preis wird vor der Zahlung auf unseren Servern neu berechnet.',
      'h.q7': 'Kann ich in meiner Währung zahlen?',
      'h.a7': 'Sechzehn Währungen stehen zur Auswahl und wir schlagen eine anhand Ihres Standorts vor.',
      'h.q8': 'Warum brauche ich ein Konto?',
      'h.a8': 'Damit Sie die Buchung wiederfinden. Es bewahrt Fahrtdetails und Rechnung an einem Ort auf.',
      'h.q9': 'Ist die Zahlung sicher?',
      'h.a9': 'Die Zahlung läuft über Stripe Checkout. Ihre Kartendaten berühren unsere Server nie.',
      'h.s2t': 'Ihr Fahrer ist bereits da',
    }
  };

  var SUPPORTED = ['en', 'es', 'de'];

  /**
   * A língua, por esta ordem: o que a pessoa escolheu, o que o
   * endereço diz, o que o browser prefere.
   *
   * A escolha manda sempre. Alguém que vive na Alemanha e prefere
   * inglês não quer ter de reescolher em cada visita.
   */
  function pickLang() {
    try {
      var saved = localStorage.getItem('airportlink-lang');
      if (SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) {}

    var fromPath = window.location.pathname.match(/^\/(es|de)\//);
    if (fromPath) return fromPath[1];

    var fromQuery = window.location.search.match(/[?&]lang=(en|es|de)\b/);
    if (fromQuery) return fromQuery[1];

    var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.indexOf(nav) !== -1 ? nav : 'en';
  }

  var lang = pickLang();
  var dict = DICT[lang] || {};

  /** A tradução, ou o inglês se a chave faltar. */
  function t(key, fallback) {
    return dict[key] || fallback || key;
  }

  /** Percorre a página e troca tudo o que tiver data-i18n. */
  function apply(root) {
    var scope = root || document;

    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n')];
      if (v) el.textContent = v;
    });

    scope.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-ph')];
      if (v) el.setAttribute('placeholder', v);
    });

    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      var v = dict[el.getAttribute('data-i18n-aria')];
      if (v) el.setAttribute('aria-label', v);
    });

    document.documentElement.setAttribute('lang', lang);
  }

  /** A data e o preço no formato de cada país. */
  function formatDate(d, opts) {
    var locale = lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-GB';
    return d.toLocaleDateString(locale, opts);
  }

  function setLang(next) {
    if (SUPPORTED.indexOf(next) === -1) return;
    try { localStorage.setItem('airportlink-lang', next); } catch (e) {}
    window.location.reload();
  }

  window.i18n = {
    lang: lang,
    t: t,
    apply: apply,
    formatDate: formatDate,
    setLang: setLang,
    supported: SUPPORTED
  };

  function boot() { apply(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
