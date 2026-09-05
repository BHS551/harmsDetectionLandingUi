# Nota de contexto: estado del sistema de cara a más clientes

Resumen para quien trabaje en adquisición de clientes o mensajes de
marketing de SkyEye. El análisis completo, técnico, vive en
[`harmsDetection/ROADMAP_CLIENTES.md`](https://github.com/BHS551/harmsDetection/blob/main/ROADMAP_CLIENTES.md)
(sesión programada del 2026-09-05).

## Lo que hoy es defendible en un mensaje comercial

- **Coste**: la cascada de detección redujo el gasto de Bedrock un 87%
  frente a la línea base (120 → 15 USD/cámara/mes), y el modelo de motion
  box compartido baja el total a ~19 USD/mes por cámara en un paquete de 10.
- **Cero falsos positivos** en el banco de pruebas de escenas normales
  (6/6 limpias): el sistema no satura de alertas falsas.
- **Aislamiento de datos correcto**: cada cliente solo puede leer sus propias
  cámaras y detecciones (aplicado a nivel de clave en DynamoDB, no por
  filtro), y las credenciales RTSP nunca viajan al frontend ni a logs.

## Lo que todavía NO hay que prometer

- **Detección fiable de violencia/robos**: el banco de pruebas mide 1/4
  incidentes abstractos detectados correctamente. Prometer "detección de
  robos y violencia" como garantía es el riesgo reputacional/legal más alto
  identificado en la investigación técnica.
- **Caídas** están a medio camino: el plan para resolverlas con un modelo de
  pose (YOLOv8-Pose, 92–98% sin VLM) está diseñado pero no implementado
  todavía (ciclo 4 en `harmsDetection/testbench/BITACORA.md`).
- **SLA de tiempo de respuesta**: no hay observabilidad de latencia end to
  end todavía, así que no hay una cifra medida que se pueda ofrecer.

## Sugerencia de enfoque inicial

El caso de uso más fuerte hoy es **presencia de personas + caídas** (obra,
adultos mayores, residencias) antes que "seguridad genérica contra robos y
violencia". Es donde la tecnología actual (una vez cerrado el ciclo 4) tiene
mejor evidencia.

También falta, antes de escalar ventas: una página de estado/transparencia
de limitaciones para el cliente, y una revisión legal de privacidad y
videovigilancia (relevante para el mercado latinoamericano donde opera
PayU).
