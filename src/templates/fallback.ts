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

    // -------------------------------------------
    // 🚨 Usuario pide humano
    // -------------------------------------------

    

    if (humanTriggers.some(t => message.includes(t))) {

  await state.update({ human: true });

  await flowDynamic([
    "👌 ¡Perfecto!",
    "Un asesor humano se pondrá en contacto contigo a la brevedad.",
  ]);

  // 📌 Lista de agentes configurados en .env
const rawAgents = process.env.HUMAN_AGENTS?.split(",") || [];


if (rawAgents.length === 0) {
  console.error("❌ No hay agentes configurados en HUMAN_AGENTS");
  return;
}

for (const agent of rawAgents) {
  const agentNumber = `whatsapp:+${agent}`;

  try {
    console.log("ENVIANDO TEMPLATE A:", agentNumber);

  await provider.sendTemplate(
  agentNumber,
  "client_needs_agent",
  [
    {
      type: "body",
      parameters: [
        { type: "text", text: ctx.from },
        { type: "text", text: ctx.body },
        { type: "text", text: new Date().toLocaleString("es-AR") },
      ]
    }
  ]
);


  } catch (e) {
    console.error(`❌ Error enviando a ${agentNumber}`, e.response?.data || e);
  }
}

  return;
}


    // -------------------------------------------
    // 🙅‍♂️ Si está en modo humano, no responder
    // -------------------------------------------
    if (st.human) {
      return;
    }

    // -------------------------------------------
    // 🤖 Activar IA
    // -------------------------------------------
    const respuesta = await deepSeekChat(ctx.body, ctx.from);
    await flowDynamic(respuesta);

    return;
  });



