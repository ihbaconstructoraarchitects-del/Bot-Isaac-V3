import { addKeyword, EVENTS } from '@builderbot/bot';
import sheetsService from '~/services/sheetsService';


const registerFlow = addKeyword(["registro"])
    .addAnswer('Queres comenzar con el registro?', {capture: true, buttons:[{body: "si, quiero!"},{body: "no, gracias!"}] },
        async (ctx, ctxFn) => {
            if(ctx.body === "no, gracias!"){
                return ctxFn.endFlow("El registro fue cancelado, podes volver a escribirle al bot para registrarte")
            }else if (ctx.body === "si, quiero!") {
                await ctxFn.flowDynamic("Perfecto , voy a proceder a hacerte unas preguntas")
            }else{
                return ctxFn.fallBack("Tenes que elegir alguna de las opciones!")
            }
        })

    .addAnswer('Primero, cual es tu nombre?', {capture: true},
        async (ctx, ctxFn) => {
            await ctxFn.flowDynamic("Perfecto " + ctx.body + "!😱")
            await ctxFn.state.update({"name":ctx.body})
        })

    .addAnswer('ahora, cual es tu mail', {capture: true},
        async (ctx, ctxFn) =>{
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(ctx.body)) {
                return ctxFn.fallBack('Por favor, ingresa un correo electrónico válido. ✉️')
            }

            const state = ctxFn.state.getMyState()
            // guardar usuario en sheets
            await sheetsService.createUser(ctx.from, state.name, ctx.body)

            await ctxFn.flowDynamic('Excelente! Tus datos ya fueron cargados, ya podes comenzar a utilizar el bot 🚀')
        })
        
export {registerFlow}
     