import { addKeyword,EVENTS } from "@builderbot/bot";
import sheetsService from "~/services/sheetsService";
import { registerFlow } from "./registerFlow";
import { fallbackDeepSeekFlow } from "./fallback";



const mainFlow = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, ctxFn)=> {
        const isUser = await sheetsService.userExists(ctx.from)
        if (isUser){
            return ctxFn.gotoFlow(registerFlow)
        }else{
            ctxFn.gotoFlow(fallbackDeepSeekFlow)
        }
    })

export  {mainFlow};