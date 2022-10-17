import {Service} from '../model/service';

const schedule = require('node-schedule');

export class ScheduleService implements Service {
    public readonly name = 'Schedule';
    public readonly environmentVariables = [];

    private readonly scheduledFunctions: (() => void)[] = [];

    constructor(...scheduledFunctions: (() => void)[]) {
        this.scheduledFunctions = scheduledFunctions;
    }

    init(_: Record<string, string>): Promise<void> {
        schedule.scheduleJob('* * * * * *', () => {
            this.scheduledFunctions
                .forEach((fn) => fn());
        });

        return Promise.resolve();
    }

    public destruct(): Promise<void> {
        return schedule.gracefulShutdown();
    }
}
