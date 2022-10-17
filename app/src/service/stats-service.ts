import {Stats} from '../model/stats';
import {Account} from '../model/account';
import {DateTime, Duration} from 'luxon';
import {Service} from '../model/service';
import {InfluxService} from './influx-service';
import {Point} from '@influxdata/influxdb-client';


export class StatsService implements Service {
    public readonly name = 'Stats';
    public readonly environmentVariables = [
        'IG_HANDLES',
        'IG_CYCLE_DUR_SEC',
        'IG_JITTER_SEC',
        'IG_COOKIE'
    ];

    private readonly influxService: InfluxService;
    private readonly options: RequestInit = {
        headers: {
            'sec-fetch-site': 'same-site',
        }
    };

    private timeBetweenAccounts: Duration;
    private jitterTime;
    private accounts: Account[];


    constructor(influxService: InfluxService) {
        this.influxService = influxService;
    }

    init(envVars: Record<string, string>): Promise<void> {
        const handles: string[] = JSON.parse(envVars.IG_HANDLES);
        const fullUpdateCycle: Duration = Duration.fromObject({seconds: parseInt(envVars.IG_CYCLE_DUR_SEC)});

        this.options.headers['cookie'] = envVars.IG_COOKIE;
        this.options.headers['x-ig-app-id'] = envVars.IG_APP_ID;
        this.timeBetweenAccounts = Duration.fromObject({seconds: fullUpdateCycle.as('seconds') / (handles.length)});
        this.jitterTime = parseInt(envVars.IG_JITTER_SEC);
        this.accounts = this.initializeAccounts(handles);

        return Promise.resolve();
    }

    private initializeAccounts(handles: string[]): Account[] {
        const now: DateTime = DateTime.now();

        return handles.map((handle, index) => ({
            handle: handle,
            nextTime: now.plus(this.durationMultiply(this.timeBetweenAccounts, index)).plus(this.randomJitter(this.jitterTime))
        }));
    }

    private durationMultiply(duration: Duration, multiplier: number): Duration {
        return Duration.fromObject({
            seconds: duration.as('seconds') * multiplier
        });
    }

    public destruct(): Promise<void> {
        return Promise.resolve();
    }


    public accountJob(): void {
        const now: DateTime = DateTime.now();

        for (let i = 0; i < this.accounts.length; i++) {
            const account = this.accounts[i];
            const previousAccount = this.accounts[i === 0 ? this.accounts.length - 1 : i - 1]

            if (account.nextTime <= now) {
                this.getStats(account.handle)
                    .then(
                        stats => this.writeStats(stats),
                        reason => console.warn('Failed to get stats from IG.', reason)
                    );

                account.nextTime = previousAccount.nextTime.plus(this.timeBetweenAccounts).plus(this.randomJitter(this.jitterTime));
            }
        }
    }

    private randomJitter(max: number): Duration {
        return Duration.fromObject({
            seconds: Math.round(Math.random() * 2 * max - max)
        });
    }

    private async getStats(handle: string): Promise<Stats> {
        const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${handle}`;

        return fetch(url, this.options)
            .then(response => {
                if (response.url !== url) {
                    return Promise.reject(`Redirected to ${response.url}`);
                }

                if (!response.ok) {
                    return Promise.reject(`Status was ${response.statusText} (${response.status})`);
                }

                return response.json();
            })
            .then(data => {
                const user = data.data.user;
                return {
                    handle,
                    followers: user.edge_followed_by.count,
                    following: user.edge_follow.count,
                    posts: user.edge_owner_to_timeline_media.count
                }
            });
    }

    private writeStats(stats: Stats): Promise<void> {
        const timestamp: DateTime = DateTime.now();

        if (process.env.DEBUG) {
            console.log(timestamp.toISO(), stats)
        }

        const points: Point[] = ['followers', 'following', 'posts']
            .map(measurementName => {
                return new Point(measurementName)
                    .tag('handle', stats.handle)
                    .floatField('value', stats[measurementName])
                    .timestamp(timestamp.toSeconds());
            });

        return this.influxService.writePoints(points);
    }
}
