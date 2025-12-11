import { addKeyword } from '@builderbot/bot';
import { deepSeekChat } from '../services/AiDeep';

export const fallbackDeepSeekFlow = addKeyword([''])
  .addAction(async (ctx, { state, provider, flowDynamic }) => {

    const message = ctx.body.toLowerCase().trim();
    const st = await state.getMyState() || {};

    const humanTriggers = [
      "agente", "asesor", "representante",
      "humano", "persona",
      "quiero hablar con alguien",
      "hablar con alguien",
      "hablar con un agente",
    ];

    // 🚨 Usuario pide humano
    if (humanTriggers.some(t => message.includes(t))) {

      await state.update({ human: true });

      await flowDynamic([
        "👌 ¡Perfecto!",
        "Un asesor humano se pondrá en contacto contigo a la brevedad.",
      ]);

      // 📌 Leer agentes desde .env
      const rawAgents = process.env.HUMAN_AGENTS?.split(",") || [];
      
      if (rawAgents.length === 0) {
        console.error("❌ No hay agentes configurados en HUMAN_AGENTS");
        return;
      }

      // Crear mensaje que se enviará a cada agente
      const alertMessage =
        `🚨 *Nuevo cliente solicita un agente*\n\n` +
        `👤 *Número:* ${ctx.from}\n` +
        `💬 *Mensaje:* ${ctx.body}\n` +
        `📅 *Fecha:* ${new Date().toLocaleString("es-AR")}`;

      // 🔄 Enviar mensaje a cada agente
      for (let agent of rawAgents) {
        agent = agent.trim();

        try {
          console.log("ENVIANDO MENSAJE A:", agent);

          await provider.sendText(agent, alertMessage);

          console.log("✔ Notificación enviada a", agent);

        } catch (e) {
          console.error(`❌ Error enviando mensaje a ${agent}`, e);
        }
      }

      return;
    }

    // 🙅‍♂️ Si está en modo humano, no responder
    if (st.human) return;

    // 🤖 Activar IA
    const respuesta = await deepSeekChat(ctx.body, ctx.from);
    await flowDynamic(respuesta);

    return;
  });
