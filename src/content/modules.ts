import type { DeviceModelType } from '../types/hardware';

/**
 * Contenido del curso. Cada módulo se recorre en tres pasos:
 *   1. Teoría: tarjetas cortas, una a la vez.
 *   2. Preguntas: se cargan desde el servidor (las respuestas nunca están aquí).
 *   3. Práctica: misión 3D, casos de diagnóstico o procedimiento guiado.
 *
 * En los párrafos, [[clave]] o [[clave|texto]] enlaza al glosario.
 */

export interface TheoryVisual {
  device: DeviceModelType;
  componentId: string;
  /** 0 = cerrado, 1 = despiezado */
  explode?: number;
  caption: string;
}

export interface TheoryCard {
  id: string;
  title: string;
  body: string[];
  visual?: TheoryVisual;
  callout?: { kind: 'tip' | 'safety'; text: string };
}

export interface MissionTarget {
  componentId: string;
  prompt: string;
  /** Pista que se muestra después de un error */
  hint: string;
}

export type PracticeSpec =
  | {
      kind: 'mission';
      title: string;
      intro: string;
      device: DeviceModelType;
      /** Despiece inicial sugerido para que las piezas sean visibles */
      startExploded?: boolean;
      ordered?: boolean;
      targets: MissionTarget[];
    }
  | {
      kind: 'diagnosis';
      title: string;
      intro: string;
      caseIds: string[];
    }
  | {
      kind: 'procedure';
      title: string;
      intro: string;
      tutorialId: string;
    };

export interface CourseModule {
  id: string;
  number: number;
  title: string;
  /** Una frase: qué vas a poder hacer al terminar */
  outcome: string;
  minutes: number;
  theory: TheoryCard[];
  practice: PracticeSpec;
}

export const courseModules: CourseModule[] = [
  // -------------------------------------------------------------------
  {
    id: 'edu_basics',
    number: 1,
    title: 'Conceptos básicos de hardware',
    outcome: 'Distinguir qué hace cada parte principal de una computadora.',
    minutes: 15,
    theory: [
      {
        id: 'b1',
        title: 'Una computadora es un equipo de trabajo',
        body: [
          'Toda computadora, desde una PC de escritorio hasta un celular, hace lo mismo: recibe datos, los procesa, los guarda y muestra un resultado.',
          'Cada tarea la hace una pieza distinta. Si sabes qué hace cada una, sabrás dónde buscar cuando algo falla.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'motherboard',
          explode: 0.6,
          caption: 'Gira el modelo con el mouse o el dedo. Así está organizada una PC por dentro.',
        },
      },
      {
        id: 'b2',
        title: 'El procesador hace los cálculos',
        body: [
          'La [[cpu|CPU]] ejecuta las instrucciones de los programas, millones de veces por segundo. Trabaja tanto que se calienta: por eso siempre lleva un [[disipador]] y un ventilador encima.',
          'La [[gpu|tarjeta gráfica]] es otro procesador, especializado en dibujar la imagen que ves en el monitor.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'cpu',
          explode: 0.8,
          caption: 'El procesador queda debajo del disipador, en el centro de la placa madre.',
        },
      },
      {
        id: 'b3',
        title: 'Memoria y almacenamiento no son lo mismo',
        body: [
          'La [[ram|RAM]] es la mesa de trabajo: guarda lo que usas ahora mismo y se vacía al apagar, porque es [[volatil|memoria volátil]].',
          'El almacenamiento ([[ssd|SSD]] o [[hdd|HDD]]) es el archivero: conserva programas y archivos aunque no haya energía.',
          'Por eso "mi PC está lenta" (poca RAM) y "mi PC no tiene espacio" (almacenamiento lleno) son problemas distintos.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'ram',
          explode: 0.8,
          caption: 'Los módulos de RAM van de pie en ranuras junto al procesador.',
        },
      },
      {
        id: 'b4',
        title: 'La placa madre y la fuente lo conectan todo',
        body: [
          'La placa madre une todas las piezas: por sus pistas de cobre viajan datos y energía. Su programa interno, la [[uefi|BIOS/UEFI]], revisa el hardware al encender.',
          'La fuente de poder convierte la corriente del enchufe en los voltajes bajos que necesita cada componente.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'psu',
          explode: 0.8,
          caption: 'La fuente suele ir abajo, en la parte trasera del gabinete.',
        },
        callout: {
          kind: 'tip',
          text: 'Para diagnosticar, primero pregúntate qué tarea falla: ¿procesar, recordar, guardar, mostrar o alimentar? Eso te dice qué pieza revisar.',
        },
      },
    ],
    practice: {
      kind: 'mission',
      title: 'Misión: reconoce las piezas',
      intro: 'Vas a buscar en el modelo 3D las piezas que acabas de estudiar. Haz clic sobre cada una cuando la encuentres.',
      device: 'desktop',
      startExploded: true,
      targets: [
        { componentId: 'motherboard', prompt: 'Encuentra la placa que conecta a todas las demás piezas.', hint: 'Es la placa grande montada de pie sobre la bandeja interior del gabinete.' },
        { componentId: 'ram', prompt: 'Encuentra la memoria de trabajo, la que se borra al apagar.', hint: 'Son módulos alargados, de pie, junto al disipador del procesador.' },
        { componentId: 'ssd', prompt: 'Encuentra la unidad que guarda los archivos aunque no haya energía.', hint: 'Busca una unidad plana de 2,5 pulgadas sujeta a la bandeja del gabinete; no la confundas con el disco duro, que es más grueso.' },
        { componentId: 'gpu', prompt: 'Encuentra el procesador que dibuja la imagen del monitor.', hint: 'Es una tarjeta larga y horizontal, con ventiladores, debajo del procesador.' },
        { componentId: 'psu', prompt: 'Encuentra la pieza que convierte la corriente del enchufe.', hint: 'Es una caja metálica en la parte inferior trasera.' },
      ],
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'edu_identification',
    number: 2,
    title: 'Identificación de componentes',
    outcome: 'Reconocer ranuras y conectores por su forma antes de tocar nada.',
    minutes: 15,
    theory: [
      {
        id: 'i1',
        title: 'Cada pieza tiene su lugar',
        body: [
          'Los conectores están diseñados para entrar de una sola manera. Reconocerlos por su forma te evita errores y piezas dañadas.',
          'En este módulo vas a mirar de cerca una placa madre.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_socket',
          caption: 'Una placa madre vista de frente. Toca cualquier zona para ver su nombre.',
        },
      },
      {
        id: 'i2',
        title: 'Ranuras de memoria y de expansión',
        body: [
          'La RAM va en ranuras [[dimm|DIMM]], largas y con trabas en los extremos. Las laptops usan SO-DIMM, más cortas.',
          'Las tarjetas de expansión van en ranuras [[pcie|PCI Express]]. La más larga, la x16, es para la tarjeta gráfica.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_dimm',
          caption: 'Las ranuras DIMM están a la derecha del socket del procesador.',
        },
      },
      {
        id: 'i3',
        title: 'Almacenamiento: M.2 y SATA',
        body: [
          'Un SSD moderno se atornilla directamente en una ranura [[m2|M.2]], sin cables.',
          'Los discos de 2,5" y 3,5" usan cable [[sata|SATA]] para datos y otro cable de la fuente para energía.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_m2',
          caption: 'La ranura M.2 es pequeña y queda entre el socket del procesador y la primera ranura PCIe.',
        },
      },
      {
        id: 'i4',
        title: 'Conectores de energía',
        body: [
          'El [[atx24|ATX de 24 pines]] alimenta a toda la placa y entra por su borde derecho.',
          'El [[eps|EPS de 8 pines]] llega a la esquina superior y alimenta solo al procesador. La tarjeta gráfica usa conectores PCIe de 6+2 pines.',
          'En laptops y celulares verás cables planos con conectores [[zif|ZIF/FPC]] que tienen una traba.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_atx24',
          caption: 'El conector de 24 pines está en el borde derecho de la placa.',
        },
        callout: {
          kind: 'safety',
          text: 'Ningún conector moderno debería entrar a la fuerza. Si cuesta, revisa la orientación y la muesca guía.',
        },
      },
    ],
    practice: {
      kind: 'mission',
      title: 'Misión: recorre la placa madre',
      intro: 'Busca cada ranura y conector en la placa. Si te equivocas, verás el nombre de lo que tocaste.',
      device: 'motherboard',
      targets: [
        { componentId: 'mb_dimm', prompt: 'Encuentra las ranuras donde se instala la memoria RAM.', hint: 'Son ranuras largas y paralelas, al lado derecho del procesador.' },
        { componentId: 'mb_pcie', prompt: 'Encuentra la ranura para la tarjeta gráfica.', hint: 'Es una ranura larga y horizontal en la mitad inferior izquierda de la placa.' },
        { componentId: 'mb_m2', prompt: 'Encuentra la ranura para un SSD sin cables.', hint: 'Es una ranura corta, entre el socket del procesador y la primera ranura PCIe x16.' },
        { componentId: 'mb_atx24', prompt: 'Encuentra el conector principal de energía de la placa.', hint: 'Es un conector ancho en el borde derecho.' },
        { componentId: 'mb_cpu_power', prompt: 'Encuentra el conector que alimenta solo al procesador.', hint: 'Está en la esquina superior izquierda, cerca del VRM.' },
        { componentId: 'mb_sata', prompt: 'Encuentra los puertos para cables de disco.', hint: 'Son puertos pequeños en el borde inferior derecho.' },
      ],
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'edu_preventive',
    number: 3,
    title: 'Mantenimiento preventivo',
    outcome: 'Planificar una limpieza que evite fallas por calor y polvo.',
    minutes: 20,
    theory: [
      {
        id: 'p1',
        title: 'Prevenir cuesta menos que reparar',
        body: [
          'El mantenimiento preventivo se hace cuando el equipo todavía funciona bien, cada 6 a 12 meses.',
          'Su objetivo es evitar las tres causas más comunes de falla: polvo, calor y problemas eléctricos.',
        ],
      },
      {
        id: 'p2',
        title: 'El polvo atrapa el calor',
        body: [
          'Con el tiempo se forma una capa de pelusa entre el ventilador y las aletas del [[disipador]]. El aire ya no pasa y la temperatura sube.',
          'Se limpia con brocha antiestática y aire comprimido en ráfagas cortas, sujetando las aspas para que no giren.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'case_fans',
          caption: 'Los ventiladores del gabinete mueven el aire de adelante hacia atrás.',
        },
        callout: {
          kind: 'tip',
          text: 'La mayoría de los apagados repentinos en laptops y PCs se previenen solo con limpiar la pelusa entre el ventilador y el disipador.',
        },
      },
      {
        id: 'p3',
        title: 'La pasta térmica se seca',
        body: [
          'La [[pasta|pasta térmica]] ayuda a que el calor pase del procesador al disipador. Con los años se reseca y deja de hacerlo bien.',
          'Si las temperaturas suben aunque el equipo esté limpio, toca renovarla: se limpia la vieja con [[ipa|alcohol isopropílico]] y se aplica una cantidad pequeña.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'cpu_cooler',
          explode: 0.6,
          caption: 'El disipador del procesador, donde va la pasta térmica.',
        },
      },
      {
        id: 'p4',
        title: 'Cuida la energía y el ambiente',
        body: [
          'Un regulador o supresor de picos protege la fuente y la placa de subidas de voltaje.',
          'Deja espacio alrededor del equipo para que respire, y no uses laptops sobre camas o almohadas: tapan las entradas de aire.',
        ],
      },
    ],
    practice: {
      kind: 'procedure',
      title: 'Procedimiento guiado: limpieza interna',
      intro: 'Recorre paso a paso una limpieza real. Primero confirma las medidas de seguridad; luego marca cada paso cuando entiendas qué se hace y por qué.',
      tutorialId: 'tut_case_clean',
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'edu_corrective',
    number: 4,
    title: 'Mantenimiento correctivo',
    outcome: 'Decidir qué reparar o reemplazar cuando una pieza ya falló.',
    minutes: 15,
    theory: [
      {
        id: 'c1',
        title: 'Cuando la falla ya ocurrió',
        body: [
          'El mantenimiento correctivo se hace cuando algo ya no funciona: el equipo no enciende, se apaga, no da imagen o una pieza está dañada.',
          'El objetivo es encontrar la pieza responsable y repararla o reemplazarla, sin dañar las que están bien.',
        ],
      },
      {
        id: 'c2',
        title: 'Piezas que se reemplazan',
        body: [
          'Algunas fallas no tienen arreglo: [[litio|baterías]] hinchadas, discos con sectores dañados, módulos de RAM defectuosos o pantallas rotas.',
          'En esos casos se cambia la pieza por una compatible. Antes, siempre se respaldan los datos del usuario.',
        ],
        visual: {
          device: 'laptop',
          componentId: 'lap_battery',
          explode: 0.7,
          caption: 'En una laptop, la batería está justo debajo del touchpad.',
        },
        callout: {
          kind: 'safety',
          text: 'Una batería hinchada nunca se perfora ni se presiona. Se retira con cuidado y se lleva a un punto de reciclaje.',
        },
      },
      {
        id: 'c3',
        title: 'Limpiezas profundas y BIOS',
        body: [
          'Ante derrames o corrosión, la placa se limpia con [[ipa|alcohol isopropílico al 99 %]], que arrastra la suciedad y se evapora sin dejar agua.',
          'Si el equipo pierde la hora o la configuración, la causa suele ser la [[cmos|pila CMOS]]. Se cambia y se vuelve a configurar la BIOS.',
        ],
        visual: {
          device: 'desktop',
          componentId: 'cmos_battery',
          explode: 0.8,
          caption: 'La pila CMOS es una pila de botón sobre la placa madre.',
        },
      },
      {
        id: 'c4',
        title: 'El método de descarte mínimo',
        body: [
          'Si una PC no da imagen, no cambies todo a la vez. Arma lo mínimo: placa madre, procesador y un solo módulo de RAM.',
          'Si así funciona, agrega las piezas una por una. La falla aparecerá justo cuando conectes la pieza dañada.',
        ],
      },
    ],
    practice: {
      kind: 'diagnosis',
      title: 'Casos de reparación',
      intro: 'Lee cada caso, elige la causa más probable y revisa cómo se resuelve. Si te equivocas, lee la explicación y vuelve a intentarlo.',
      caseIds: ['fc_no_post_ram', 'fc_cmos_clock', 'fc_laptop_touchpad_bulge'],
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'edu_diagnosis',
    number: 5,
    title: 'Diagnóstico de fallas',
    outcome: 'Seguir un método para encontrar la causa real sin adivinar.',
    minutes: 15,
    theory: [
      {
        id: 'd1',
        title: 'Diagnosticar no es adivinar',
        body: [
          'Un buen técnico no cambia piezas al azar. Sigue un método: observar, formular una sospecha, probar y confirmar.',
          'La meta es encontrar la [[causaRaiz|causa raíz]], no solo tapar el síntoma.',
        ],
      },
      {
        id: 'd2',
        title: 'Escucha y mira las señales',
        body: [
          'Al encender, la placa hace el [[post|POST]]. Si algo falla, avisa con pitidos o con LEDs de diagnóstico: CPU, DRAM, VGA o BOOT.',
          'Un LED DRAM encendido apunta a la memoria; uno VGA, a la tarjeta gráfica o al cable de video.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_dimm',
          caption: 'Si el LED DRAM queda encendido, revisa primero estas ranuras.',
        },
      },
      {
        id: 'd3',
        title: 'Mide antes de reemplazar',
        body: [
          'Revisa la temperatura del procesador: en carga debería quedar por debajo de unos 85 °C.',
          'Consulta la salud de los discos con [[smart|SMART]] antes de culpar al sistema operativo.',
        ],
      },
      {
        id: 'd4',
        title: '¿Software o hardware?',
        body: [
          'Si el equipo arranca y solo falla un programa, sospecha primero del software: el programa, el sistema o los controladores.',
          'Si falla antes de cargar el sistema, o en todos los programas por igual, sospecha del hardware.',
          'Cambia una sola cosa a la vez y comprueba el resultado. Así sabrás qué lo resolvió.',
        ],
        callout: {
          kind: 'tip',
          text: 'Si una PC enciende ventiladores pero no da video, revisa que el monitor esté conectado a la tarjeta gráfica y reasienta la RAM.',
        },
      },
    ],
    practice: {
      kind: 'diagnosis',
      title: 'Casos de diagnóstico',
      intro: 'Tres equipos con síntomas reales. Usa el método: lee el síntoma y el contexto, y elige la causa más probable.',
      caseIds: ['fc_thermal_shutdown', 'fc_gpu_wrong_port', 'fc_phone_charging'],
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'edu_disassembly',
    number: 6,
    title: 'Desmontaje seguro',
    outcome: 'Abrir un equipo en el orden correcto, protegiéndote a ti y a las piezas.',
    minutes: 15,
    theory: [
      {
        id: 'x1',
        title: 'La seguridad va primero',
        body: [
          'Desarmar un equipo tiene dos riesgos: dañar los componentes con electricidad estática y lastimarte con energía almacenada.',
          'Por eso el orden de los pasos importa tanto como los pasos mismos.',
        ],
      },
      {
        id: 'x2',
        title: 'Regla número uno en una PC',
        body: [
          'Apaga el equipo, desenchúfalo y mantén pulsado el botón de encendido unos 5 segundos: así se descargan los [[capacitor|capacitores]].',
          'Luego ponte la [[pulsera|pulsera antiestática]] y conecta su pinza a una parte metálica del chasis para evitar una [[esd|descarga electrostática]].',
        ],
        callout: {
          kind: 'safety',
          text: 'Nunca abras la carcasa de la fuente de poder: sus capacitores pueden conservar voltajes peligrosos aunque esté desenchufada.',
        },
      },
      {
        id: 'x3',
        title: 'Regla número uno en laptops y celulares',
        body: [
          'Después de abrir la tapa, lo primero que se desconecta es la batería interna. Así la placa se queda sin energía antes de tocar cualquier otra cosa.',
          'Usa herramientas plásticas para soltar conectores y no dobles, perfores ni calientes una [[litio|batería de litio]].',
        ],
        visual: {
          device: 'phone',
          componentId: 'ph_battery',
          explode: 0.8,
          caption: 'En un celular despiezado, la batería ocupa casi todo el centro.',
        },
      },
      {
        id: 'x4',
        title: 'Ordena los tornillos',
        body: [
          'Los tornillos tienen largos distintos. Uno largo en el lugar equivocado puede perforar una placa o una batería.',
          'Sepáralos por tamaño y ubicación en una bandeja magnética o sobre un mapa dibujado en papel.',
        ],
      },
    ],
    practice: {
      kind: 'mission',
      title: 'Misión: desarma un celular en orden',
      intro: 'Sigue la secuencia correcta de desmontaje. Haz clic en cada pieza en el orden en que la manipularías.',
      device: 'phone',
      startExploded: true,
      ordered: true,
      targets: [
        { componentId: 'ph_back_cover', prompt: 'Paso 1: ¿qué pieza retiras para acceder al interior?', hint: 'Es la tapa trasera del equipo.' },
        { componentId: 'ph_battery', prompt: 'Paso 2: ¿qué desconectas antes que cualquier otra cosa?', hint: 'Es la pieza grande que alimenta al teléfono.' },
        { componentId: 'ph_flex', prompt: 'Paso 3: ahora suelta los cables planos que unen las piezas.', hint: 'Son cables delgados y planos que recorren el interior de arriba abajo.' },
        { componentId: 'ph_motherboard', prompt: 'Paso 4: ya sin energía ni cables, ¿qué placa puedes retirar?', hint: 'Es la placa con los chips principales, en la parte superior.' },
      ],
    },
  },

  // -------------------------------------------------------------------
  {
    id: 'edu_installation',
    number: 7,
    title: 'Instalación y pruebas finales',
    outcome: 'Instalar piezas compatibles y comprobar que todo funciona antes de entregar.',
    minutes: 20,
    theory: [
      {
        id: 'n1',
        title: 'Compatibilidad antes de comprar',
        body: [
          'Antes de instalar una pieza nueva, revisa que sea compatible: el socket del procesador, la generación de RAM (DDR4 o DDR5), la potencia de la fuente y el espacio en el gabinete.',
          'Una pieza incompatible puede no entrar, no funcionar o dañar a otras.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_socket',
          caption: 'El socket define qué procesadores acepta la placa.',
        },
      },
      {
        id: 'n2',
        title: 'Instalar con cuidado',
        body: [
          'La RAM se inserta recta hasta que las trabas hagan clic en ambos extremos.',
          'Al montar un disipador, aplica una pequeña cantidad de [[pasta|pasta térmica]] en el centro y aprieta los tornillos en cruz, poco a poco.',
        ],
        visual: {
          device: 'motherboard',
          componentId: 'mb_dimm',
          caption: 'Las trabas de las ranuras DIMM se cierran solas al insertar bien el módulo.',
        },
      },
      {
        id: 'n3',
        title: 'Revisar antes de encender',
        body: [
          'Haz una revisión visual doble: cables de energía de la placa ([[atx24|24 pines]]) y del procesador ([[eps|8 pines]]), cable de la tarjeta gráfica y ventiladores.',
          'Un cable olvidado es la causa más común de que un equipo recién armado no arranque.',
        ],
      },
      {
        id: 'n4',
        title: 'Probar antes de cerrar',
        body: [
          'Enciende y comprueba que el equipo pasa el [[post|POST]], reconoce toda la memoria y los discos, y mantiene temperaturas normales.',
          'En celulares, prueba la pantalla y el táctil conectados antes de aplicar el adhesivo definitivo.',
        ],
        callout: {
          kind: 'tip',
          text: 'Entregar un equipo sin probarlo es arriesgarse a volver a abrirlo. Prueba primero, sella después.',
        },
      },
    ],
    practice: {
      kind: 'procedure',
      title: 'Procedimiento guiado: instalar memoria RAM',
      intro: 'Recorre una instalación real de memoria. Confirma la seguridad y marca cada paso cuando entiendas qué se hace.',
      tutorialId: 'tut_ram_install',
    },
  },
];

export function getModule(id: string): CourseModule | undefined {
  return courseModules.find((m) => m.id === id);
}
