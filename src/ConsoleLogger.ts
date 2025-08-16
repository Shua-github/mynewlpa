import Logger from "./Logger";

export type LogEntry = {
  type: "log" | "info" | "warn" | "error";
  message: string;
};

type Subscriber = (entry: LogEntry) => void;

export default class ConsoleLogger extends Logger {
  private subscribers: Subscriber[] = [];
  private history: LogEntry[] = [];

    subscribe(fn: Subscriber) {
        if (this.subscribers.includes(fn)) return () => {};
        this.subscribers.push(fn);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== fn);
        };
    }

    private publish(entry: LogEntry) {
        this.history.unshift(entry); // 添加到历史日志
        if (this.history.length > 500) this.history = this.history.slice(0, 500); // 保留最多 500 条
        this.subscribers.forEach(sub => sub(entry));
        return entry;
    }

    log(message: string) {
        console.log(message);
        return this.publish({ type: "log", message });
    }

    info(message: string) {
        console.info(message);
        return this.publish({ type: "info", message });
    }

    warn(message: string) {
        console.warn(message);
        return this.publish({ type: "warn", message });
    }

    error(message: string) {
        console.error(message);
        return this.publish({ type: "error", message });
    }

    // 新增方法：获取历史日志
    getHistory() {
        return [...this.history];
    }
}
