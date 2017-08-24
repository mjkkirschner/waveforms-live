import { Component } from '@angular/core';

//Services
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';

@Component({
    templateUrl: 'logger.html',
    selector: 'logger-component'
})
export class LoggerComponent {
    public ignoreFocusOut: boolean = false;
    private activeDevice: DeviceService;
    public showLoggerSettings: boolean = true;
    public showAnalogChan: boolean[] = [];
    public showDigitalChan: boolean[] = [];


    private defaultAnalogParams: AnalogLoggerParams = {
        gain: 1,
        vOffset: 0,
        maxSampleCount: -1,
        sampleFreq: 1000000,
        startDelay: 0,
        overflow: 'stop',
        storageLocation: 'ram',
        uri: '',
        startIndex: 0,
        count: 0,
        state: 'idle'
    }

    public analogChans: AnalogLoggerParams[] = [];
    public digitalChans: DigitalLoggerParams[] = [];

    constructor(
        private devicemanagerService: DeviceManagerService
    ) {
        this.activeDevice = this.devicemanagerService.devices[this.devicemanagerService.activeDeviceIndex];
        for (let i = 0; i < 2/* this.activeDevice.instruments.logger.analog.numChans */; i++) {
            this.analogChans.push(Object.assign({}, this.defaultAnalogParams));
            this.showAnalogChan.push(i === 0);
        }
        console.log(this.analogChans);
        let analogChanArray = [];
        let digitalChanArray = [];
        for (let i = 0; i < this.analogChans.length; i++) {
            analogChanArray.push(i + 1);
        }
        for (let i = 0; i < this.digitalChans.length; i++) {
            digitalChanArray.push(i + 1);
        }
        if (analogChanArray.length < 1 && digitalChanArray.length < 1) { return; }
        
        this.analogGetMultipleChannelStates(analogChanArray)
            .then((data) => {
                console.log(data);
                return this.digitalGetMultipleChannelStates(digitalChanArray);
            })
            .then((data) => {
                console.log(data);
                console.log(this.analogChans);
            })
            .catch((e) => {
                console.log(e);
            });
    }

    private analogGetMultipleChannelStates(analogChannelNumbers: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (analogChannelNumbers.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger.analog.getCurrentState('analog', analogChannelNumbers).subscribe(
                (data) => {
                    if (data.log != undefined && data.log.analog != undefined) {
                        this.applyCurrentStateResponse(data);
                    }
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    private digitalGetMultipleChannelStates(digitalChannelNumbers: number[]): Promise<any> {
        return new Promise((resolve, reject) => {
            if (digitalChannelNumbers.length < 1) {
                resolve();
                return;
            }
            this.activeDevice.instruments.logger.digital.getCurrentState('analog', digitalChannelNumbers).subscribe(
                (data) => {
                    if (data.log != undefined && data.log.digital != undefined) {
                        this.applyCurrentStateResponse(data);
                    }
                    resolve(data);
                },
                (err) => {
                    console.log(err);
                    reject(err);
                },
                () => { }
            );
        });
    }

    checkForEnter(event) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event) {
        let value: string = event.target.value;
        let parsedValue: number = parseFloat(value);

        let trueValue: number = parsedValue;
        if (value.indexOf('G') !== -1) {
            trueValue = parsedValue * Math.pow(10, 9);
        }
        else if (value.indexOf('M') !== -1) {
            trueValue = parsedValue * Math.pow(10, 6);
        }
        else if (value.indexOf('k') !== -1 || value.indexOf('K') !== -1) {
            trueValue = parsedValue * Math.pow(10, 3);
        }
        else if (value.indexOf('m') !== -1) {
            trueValue = parsedValue * Math.pow(10, -3);
        }
        else if (value.indexOf('u') !== -1) {
            trueValue = parsedValue * Math.pow(10, -6);
        }
        else if (value.indexOf('n') !== -1) {
            trueValue = parsedValue * Math.pow(10, -9);
        }

        if (trueValue > Math.pow(10, 9)) {
            trueValue = Math.pow(10, 9);
        }
        else if (trueValue < -Math.pow(10, 9)) {
            trueValue = -Math.pow(10, 9);
        }
        console.log(trueValue);
    }

    toggleLoggerSettings() {
        this.showLoggerSettings = !this.showLoggerSettings;
    }

    toggleSeriesSettings(instrument: 'analog' | 'digital', chan: number) {
        if (instrument === 'analog') {
            this.showAnalogChan[chan] = !this.showAnalogChan[chan];
        }
        else {
            this.showDigitalChan[chan] = !this.showDigitalChan[chan];
        }
    }

    private applyCurrentStateResponse(data: any) {
        for (let instrument in data.log) {
            for (let channel in data.log[instrument]) {
                if (instrument === 'analog' || instrument === 'digital') {
                    this.copyState(<'analog' | 'digital'>instrument, data.log[instrument][channel][0], (parseInt(channel) - 1));
                }
            }
        }
    }

    private copyState(instrument: 'analog' | 'digital', respObj, channelInternalIndex: number) {
        let activeChan;
        if (instrument === 'analog') {
            activeChan = this.analogChans[channelInternalIndex];
            activeChan.gain = respObj.actualGain;
            activeChan.vOffset = respObj.actualVOffset / 1000;
        }
        else {
            activeChan = this.digitalChans[channelInternalIndex];
            activeChan.bitMask = respObj.bitMask;
        }
        activeChan.maxSampleCount = respObj.maxSampleCount;
        activeChan.sampleFreq = respObj.actualSampleFreq / 1000;
        activeChan.startDelay = respObj.actualStartDelay / Math.pow(10, 12);
        activeChan.overflow = respObj.overflow;
        activeChan.storageLocation = respObj.storageLocation;
        activeChan.uri = respObj.uri;
        activeChan.state = respObj.state;
    }

    setParameters(instrument: 'analog' | 'digital', chan: number) {
        let observable;
        if (instrument === 'analog') {
            let activeChan = this.analogChans[chan];
            observable = this.activeDevice.instruments.logger.analog.setParameters(
                [chan],
                [activeChan.maxSampleCount],
                [activeChan.gain],
                [activeChan.vOffset],
                [activeChan.sampleFreq],
                [activeChan.startDelay],
                [activeChan.overflow],
                [activeChan.storageLocation],
                [activeChan.uri]
            );
        }
        else {
            let activeChan = this.digitalChans[chan];
            observable = this.activeDevice.instruments.logger.digital.setParameters(
                [chan],
                [activeChan.maxSampleCount],
                [activeChan.sampleFreq],
                [activeChan.startDelay],
                [activeChan.overflow],
                [activeChan.storageLocation],
                [activeChan.uri],
                [activeChan.bitMask]
            );
        }
        observable.subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    run(instrument: 'analog' | 'digital', chan: number) {
        this.activeDevice.instruments.logger[instrument].run(instrument, [chan + 1]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    stop(instrument: 'analog' | 'digital', chan: number) {
        this.activeDevice.instruments.logger[instrument].stop(instrument, [chan + 1]).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    read(instrument: 'analog' | 'digital', chan: number) {
        let activeChan;
        if (instrument === 'analog') {
            activeChan = this.analogChans[chan];
        }
        else {
            activeChan = this.digitalChans[chan];
        }
        this.activeDevice.instruments.logger[instrument].read(instrument, [chan + 1], activeChan.startIndex, activeChan.count).subscribe(
            (data) => {
                console.log(data);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }

    getCurrentState(instrument: 'analog' | 'digital', chan: number) {
        let activeChan;
        if (instrument === 'analog') {
            activeChan = this.analogChans[chan];
        }
        else {
            activeChan = this.digitalChans[chan];
        }
        this.activeDevice.instruments.logger[instrument].getCurrentState(instrument, [chan + 1]).subscribe(
            (data) => {
                console.log(data);
                let respObj = data.log[instrument][chan + 1][0];
                this.copyState(instrument, respObj, chan);
                console.log(this.analogChans);
            },
            (err) => {
                console.log(err);
            },
            () => { }
        );
    }
}

export interface LoggerParams {
    maxSampleCount: number,
    sampleFreq: number,
    startDelay: number,
    overflow: 'stop' | 'circular',
    storageLocation: string,
    uri: string,
    startIndex: number,
    count: number,
    state: LoggerChannelState
}

export type LoggerChannelState = 'busy' | 'idle' | 'stopped' | 'running';

export interface AnalogLoggerParams extends LoggerParams {
    gain: number,
    vOffset: number
}

export interface DigitalLoggerParams extends LoggerParams {
    bitMask: number
}