import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./mainFlow";
import { iaFlow } from "./iaFlow";
import { fallbackDeepSeekFlow } from "./fallback";
import { registerFlow } from "./registerFlow";
export default createFlow([
    mainFlow,
    fallbackDeepSeekFlow
]);