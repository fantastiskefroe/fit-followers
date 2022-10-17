import {Service} from '../model/service';
import {InfluxDB, Point, WriteApi} from '@influxdata/influxdb-client';

export class InfluxService implements Service {
    public readonly name = 'Influx';
    public readonly environmentVariables = [
        'INFLUX_URL',
        'INFLUX_TOKEN',
        'INFLUX_ORG',
        'INFLUX_BUCKET'
    ];

    private influxWriteApi: WriteApi;

    public init(envVars: Record<string, string>): Promise<void> {
        const influxDB = new InfluxDB({url: envVars.INFLUX_URL, token: envVars.INFLUX_TOKEN});
        this.influxWriteApi = influxDB.getWriteApi(envVars.INFLUX_ORG, envVars.INFLUX_BUCKET, 's');

        return Promise.resolve();
    }

    public destruct(): Promise<void> {
        return this.influxWriteApi.close();
    }


    public writePoints(points: Point[]): Promise<void> {
        points
            .forEach(point => this.influxWriteApi.writePoint(point));

        return this.influxWriteApi.flush();
    }

    public writePoint(point: Point): Promise<void> {
        this.influxWriteApi.writePoint(point);

        return this.influxWriteApi.flush();
    }
}
