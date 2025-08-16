import ConsoleLogger from "./ConsoleLogger"
import LPAC from "./driver/lpac";

export const logger = new ConsoleLogger();
export const lpac = new LPAC({ logger });