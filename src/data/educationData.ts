import type { FaultCase } from '../types/hardware';

// Casos de diagnóstico para la práctica de los módulos 4 y 5.
// Las preguntas de evaluación (con respuestas) viven SOLO en el servidor:
// ver migrations/ y content-private/ (no se publica).
export const faultCases: FaultCase[] = [
  {
    id: 'fc_thermal_shutdown',
    device: 'Laptop / PC de Escritorio',
    symptom: 'El equipo se apaga bruscamente después de 10 minutos jugando o editando video.',
    context: 'El ventilador suena al máximo constantemente y el aire que sale por la rejilla está muy caliente o casi no sale aire.',
    options: [
      {
        id: 'opt_1',
        label: 'Obstrucción de polvo en el disipador y pasta térmica reseca (protección térmica)',
        isCorrect: true,
        feedback: '¡Exacto! Cuando el CPU supera su límite térmico (TJMax ~95-105 °C), la placa madre apaga el equipo por protección. Limpiar el radiador y renovar pasta térmica resuelve la falla.',
      },
      {
        id: 'opt_2',
        label: 'Falla de la batería CMOS CR2032',
        isCorrect: false,
        feedback: 'Una batería CMOS agotada solo reinicia la fecha/hora y ajustes de BIOS, pero nunca provoca apagados bruscos bajo carga térmica.',
      },
      {
        id: 'opt_3',
        label: 'Cable HDMI defectuoso',
        isCorrect: false,
        feedback: 'Un cable HDMI dañado ocasionaría pérdida de señal en pantalla, no apagado eléctrico súbito del sistema.',
      },
    ],
    solutionSteps: [
      'Desarmar y retirar la alfombra de pelusa acumulada entre el ventilador y las aletas del disipador.',
      'Limpiar pasta térmica endurecida con alcohol isopropílico al 99%.',
      'Aplicar pasta térmica nueva, rearmar y validar temperaturas bajo carga.',
    ],
  },
  {
    id: 'fc_no_post_ram',
    device: 'PC de Escritorio',
    symptom: 'La PC enciende sus luces y ventiladores, pero el monitor dice "Sin señal" y el LED DRAM queda encendido.',
    context: 'El equipo fue trasladado recientemente en auto o limpiado por dentro hace unas horas.',
    options: [
      {
        id: 'opt_1',
        label: 'Módulo de memoria RAM mal asentado o contactos sucios en las ranuras DIMM',
        isCorrect: true,
        feedback: '¡Correcto! El LED DRAM encendido indica que la placa madre no logra inicializar la memoria RAM. Limpiar contactos y reasentar hasta escuchar clic suele resolverlo.',
      },
      {
        id: 'opt_2',
        label: 'El disco duro HDD está lleno al 100%',
        isCorrect: false,
        feedback: 'Un disco lleno impide iniciar el sistema operativo correctamente, pero sí permite ver imagen de BIOS/POST en pantalla.',
      },
      {
        id: 'opt_3',
        label: 'Falta instalar el sistema operativo Windows/Linux',
        isCorrect: false,
        feedback: 'Sin sistema operativo la computadora muestra igualmente el logotipo del fabricante y la BIOS en el monitor.',
      },
    ],
    solutionSteps: [
      'Desenchufar la PC, descargar estática y extraer los módulos RAM.',
      'Limpiar los contactos dorados con alcohol isopropílico y soplar las ranuras DIMM.',
      'Reinsertar con firmeza en ranuras A2 y B2 hasta que ambos seguros cierren.',
    ],
  },
  {
    id: 'fc_phone_charging',
    device: 'Teléfono Celular',
    symptom: 'El cable de carga no entra hasta el fondo, queda flojo y solo carga si se sostiene inclinado.',
    context: 'El usuario guarda habitualmente el celular en el bolsillo del pantalón y la batería dura bien cuando logra cargar.',
    options: [
      {
        id: 'opt_1',
        label: 'Pelusa compactada en el fondo del puerto USB-C / Lightning',
        isCorrect: true,
        feedback: '¡Muy bien! Es la causa más habitual: la pelusa de tela se compacta con cada conexión impidiendo que el conector macho haga tope y contacto firme.',
      },
      {
        id: 'opt_2',
        label: 'Pantalla OLED dañada',
        isCorrect: false,
        feedback: 'La pantalla no tiene relación mecánica con la holgura física del cable de carga.',
      },
      {
        id: 'opt_3',
        label: 'Batería perforada',
        isCorrect: false,
        feedback: 'Una batería perforada es una emergencia química/térmica grave, no una obstrucción mecánica en el puerto externo.',
      },
    ],
    solutionSteps: [
      'Apagar completamente el smartphone.',
      'Con un palillo plástico fino (nunca metal), retirar con suavidad la pelusa compactada del fondo del puerto.',
      'Soplar con aire comprimido y comprobar el ajuste firme del cable.',
    ],
  },
  {
    id: 'fc_laptop_touchpad_bulge',
    device: 'Laptop o Computadora Portátil',
    symptom: 'El touchpad se levantó por un borde, cuesta hacer clic y la tapa inferior se nota abombada.',
    context: 'La laptop suele mantenerse conectada al cargador todo el día en un ambiente caluroso.',
    options: [
      {
        id: 'opt_1',
        label: 'Batería de polímero de litio hinchada por degradación de gases internos',
        isCorrect: true,
        feedback: '¡Diagnóstico crítico acertado! La batería está ubicada justo debajo del touchpad; al hincharse empuja el chasis hacia arriba y representa riesgo de incendio si se perfora.',
      },
      {
        id: 'opt_2',
        label: 'Bisagra demasiado apretada',
        isCorrect: false,
        feedback: 'Las bisagras están en la zona trasera junto a la pantalla, no debajo del touchpad frontal.',
      },
      {
        id: 'opt_3',
        label: 'Fallo de controlador del mouse',
        isCorrect: false,
        feedback: 'Un fallo de software nunca deforma físicamente el chasis ni levanta el touchpad.',
      },
    ],
    solutionSteps: [
      'Apagar el equipo de inmediato, desconectar el cargador y no volver a cargarlo.',
      'Abrir la tapa inferior con cuidado sin presionar ni perforar la batería.',
      'Desconectar el conector de la batería, desatornillarla y entregarla a reciclaje seguro; instalar un repuesto certificado.',
    ],
  },
  {
    id: 'fc_gpu_wrong_port',
    device: 'PC de Escritorio',
    symptom: 'PC recién ensamblada con tarjeta gráfica dedicada: todo gira, pero la pantalla está negra.',
    context: 'El estudiante conectó el cable HDMI en el puerto superior vertical de la placa madre en vez de hacerlo abajo.',
    options: [
      {
        id: 'opt_1',
        label: 'Cable HDMI conectado a la placa madre en lugar de a la tarjeta gráfica dedicada',
        isCorrect: true,
        feedback: '¡Correcto! Muchos procesadores no tienen gráficos integrados o se desactivan al detectar una GPU dedicada; la salida de video activa está horizontalmente en la GPU.',
      },
      {
        id: 'opt_2',
        label: 'Falta de pasta térmica en el disco SSD',
        isCorrect: false,
        feedback: 'Eso no impide que el video salga por el puerto correcto al encender.',
      },
      {
        id: 'opt_3',
        label: 'Cable SATA mal orientado',
        isCorrect: false,
        feedback: 'Un error en almacenamiento no corta la señal de imagen de arranque POST.',
      },
    ],
    solutionSteps: [
      'Desconectar el cable HDMI del panel trasero de la placa madre.',
      'Conectarlo en uno de los puertos HDMI/DisplayPort horizontales de la tarjeta gráfica GPU.',
      'Verificar también que los cables de alimentación PCIe de la GPU estén bien conectados.',
    ],
  },
  {
    id: 'fc_cmos_clock',
    device: 'PC de Escritorio',
    symptom: 'Cada vez que se corta la luz o se desenchufa la PC, pierde la fecha, la hora y pide presionar F1 al arrancar.',
    context: 'La computadora tiene más de 5 años de uso y funciona normal una vez que entra al sistema operativo.',
    options: [
      {
        id: 'opt_1',
        label: 'Batería CMOS CR2032 agotada en la placa madre',
        isCorrect: true,
        feedback: '¡Exacto! Cuando la pila CR2032 cae por debajo de ~2.7V, el chip RTC/CMOS pierde la hora y los ajustes de BIOS al perder corriente alterna.',
      },
      {
        id: 'opt_2',
        label: 'Tarjeta gráfica sobrecalentada',
        isCorrect: false,
        feedback: 'La GPU no almacena la fecha ni la configuración del BIOS.',
      },
      {
        id: 'opt_3',
        label: 'Ventilador frontal desconectado',
        isCorrect: false,
        feedback: 'Un ventilador frontal no afecta el reloj interno RTC de la placa madre.',
      },
    ],
    solutionSteps: [
      'Apagar y desenchufar la PC de la corriente.',
      'Ubicar la batería circular CR2032 en la placa madre y liberarla suavemente con espátula plástica.',
      'Insertar una pila CR2032 nueva con el signo "+" hacia arriba y reajustar hora en BIOS.',
    ],
  },
];
