/**
 * Glosario. En el texto de teoría se marca un término con [[clave]] o
 * [[clave|texto visible]] y se muestra como una palabra subrayada que abre
 * su definición.
 */
export const glossary: Record<string, { term: string; definition: string }> = {
  cpu: {
    term: 'CPU (procesador)',
    definition: 'Chip que ejecuta las instrucciones de los programas. Hace los cálculos de todo el equipo.',
  },
  gpu: {
    term: 'GPU (tarjeta gráfica)',
    definition: 'Procesador especializado en imágenes. Genera lo que ves en el monitor.',
  },
  ram: {
    term: 'RAM',
    definition: 'Memoria de trabajo. Guarda los datos que se usan en este momento y se borra al apagar.',
  },
  volatil: {
    term: 'Memoria volátil',
    definition: 'Memoria que pierde su contenido cuando se corta la energía, como la RAM.',
  },
  ssd: {
    term: 'SSD',
    definition: 'Unidad de almacenamiento con chips de memoria flash. No tiene partes móviles y es muy rápida.',
  },
  hdd: {
    term: 'HDD (disco duro)',
    definition: 'Unidad de almacenamiento con platos magnéticos que giran. Es más lenta y frágil que un SSD.',
  },
  uefi: {
    term: 'BIOS / UEFI',
    definition: 'Programa guardado en la placa madre que prueba el hardware al encender y arranca el sistema operativo.',
  },
  chipset: {
    term: 'Chipset',
    definition: 'Chip de la placa madre que coordina la comunicación entre el procesador y los puertos, discos y tarjetas.',
  },
  dimm: {
    term: 'DIMM / SO-DIMM',
    definition: 'Formatos de módulo de RAM. DIMM es el largo, para PC de escritorio; SO-DIMM es el corto, para laptops.',
  },
  pcie: {
    term: 'PCI Express (PCIe)',
    definition: 'Tipo de ranura para tarjetas de expansión. La x16 es la más larga y se usa para la tarjeta gráfica.',
  },
  m2: {
    term: 'M.2',
    definition: 'Ranura pequeña donde se atornilla un SSD en forma de tarjeta, sin cables.',
  },
  sata: {
    term: 'SATA',
    definition: 'Conector y cable para discos HDD y SSD de 2,5". Es más lento que M.2 NVMe.',
  },
  atx24: {
    term: 'ATX 24 pines',
    definition: 'Conector principal de la fuente que alimenta a toda la placa madre.',
  },
  eps: {
    term: 'EPS 8 pines',
    definition: 'Conector de la fuente que alimenta específicamente al procesador.',
  },
  zif: {
    term: 'Conector ZIF / FPC',
    definition: 'Conectores para cables planos (flex). Tienen una traba que se levanta antes de retirar el cable.',
  },
  pasta: {
    term: 'Pasta térmica',
    definition: 'Compuesto que rellena las micro-imperfecciones entre el procesador y el disipador para que el calor pase mejor.',
  },
  disipador: {
    term: 'Disipador',
    definition: 'Pieza metálica con aletas que recibe el calor del chip para que el aire del ventilador lo saque.',
  },
  ipa: {
    term: 'Alcohol isopropílico 99 %',
    definition: 'Solvente de limpieza para electrónica. Se evapora rápido y casi no deja residuos.',
  },
  esd: {
    term: 'Descarga electrostática (ESD)',
    definition: 'Chispa de electricidad estática del cuerpo. Puede ser invisible para ti y aun así dañar un chip.',
  },
  pulsera: {
    term: 'Pulsera antiestática',
    definition: 'Pulsera conectada al chasis metálico que iguala tu carga eléctrica con la del equipo.',
  },
  post: {
    term: 'POST',
    definition: 'Autoprueba que hace la placa madre al encender. Si algo falla, avisa con pitidos o LEDs.',
  },
  smart: {
    term: 'SMART',
    definition: 'Sistema de autodiagnóstico de los discos. Avisa cuando un disco empieza a fallar.',
  },
  vrm: {
    term: 'VRM',
    definition: 'Módulo regulador de voltaje. Convierte los 12 V de la fuente al voltaje bajo y estable que necesita la CPU.',
  },
  cmos: {
    term: 'Pila CMOS',
    definition: 'Pila de botón (CR2032) que mantiene el reloj y la configuración de BIOS cuando el equipo está desenchufado.',
  },
  capacitor: {
    term: 'Capacitor',
    definition: 'Componente que almacena carga eléctrica. Algunos la conservan aun con el equipo desenchufado.',
  },
  litio: {
    term: 'Batería de litio',
    definition: 'Batería recargable de laptops y celulares. Si se perfora, dobla o hincha puede incendiarse.',
  },
  causaRaiz: {
    term: 'Causa raíz',
    definition: 'El origen real de una falla, no solo el síntoma que se ve.',
  },
};

export type GlossaryKey = keyof typeof glossary;
