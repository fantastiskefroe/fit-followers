import {Service} from '../model/service';
import mqtt from 'mqtt';

export class MqttService implements Service {
    public readonly name = 'MQTT';
    public readonly environmentVariables = [
        'MQTT_HOST',
        'MQTT_PORT'
    ];

    private client;

    public init(): Promise<void> {
        const host = process.env.MQTT_HOST;
        const port = process.env.MQTT_PORT;

        return new Promise(resolve => {
            this.client = mqtt.connect(`mqtt://${host}:${port}`);
            this.client.on('connect', resolve)
        });
    }

    public publish(topic: string, data: string): Promise<any> {
        return new Promise(resolve => {
            this.client.publish(topic, data, {}, (err) => resolve(err));
        });
    }

    public destruct(): Promise<void> {
        return new Promise(resolve => {
            this.client.end();
            this.client.on('disconnect', resolve)
        });
    }
}
