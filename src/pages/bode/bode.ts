import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

//Components
import { BodePlotComponent } from '../../components/bode-plot/bode-plot.component';

//Services
import { UtilityService } from '../../services/utility/utility.service';
import { DeviceManagerService, DeviceService } from 'dip-angular2/services';
import { ToastService } from '../../services/toast/toast.service';

//Interfaces
import { SweepType } from '../../components/bode-plot/bode-plot.component';

@Component({
    templateUrl: "bode.html"
})
export class BodePage {
    @ViewChild('bodeComponent') bodeComponent: BodePlotComponent;
    public navCtrl: NavController;
    public startFreq: number = 100;
    public stopFreq: number = 10000;
    public stepsPerDec: string = '10';
    public ignoreFocusOut: boolean = false;
    public sweepType: SweepType = 'Log';
    public sweepTypeArray: SweepType[] = ['Log', 'Linear'];
    public vertScale: SweepType = 'Log';
    private activeDevice: DeviceService;
    private dismissCallback: () => void;

    constructor(
        _navCtrl: NavController,
        private utilityService: UtilityService,
        private deviceManagerService: DeviceManagerService,
        private toastService: ToastService,
        private navParams: NavParams
    ) {
        this.navCtrl = _navCtrl;
        this.dismissCallback = this.navParams.get('onBodeDismiss');
        this.activeDevice = this.deviceManagerService.devices[this.deviceManagerService.activeDeviceIndex];
    }

    select(event, type: 'vert' | 'sweep') {
        if (type === 'sweep') {
            this.sweepType = event;
        }
        else if (type === 'vert') {
            this.vertScale = event;
            if (this.vertScale === 'Log') {
                this.bodeComponent.transformToLog('y');
            }
            else if (this.vertScale === 'Linear') {
                this.bodeComponent.transformToLinear('y');
            }
        }
    }
    
    checkForEnter(event, input: BodeInput) {
        if (event.key === 'Enter') {
            this.formatInputAndUpdate(event, input);
            this.ignoreFocusOut = true;
        }
    }

    inputLeave(event, input:  BodeInput) {
        if (!this.ignoreFocusOut) {
            this.formatInputAndUpdate(event, input);
        }
        this.ignoreFocusOut = false;
    }

    formatInputAndUpdate(event, input:  BodeInput) {
        let min = this.activeDevice.instruments.awg.chans[0].signalFreqMin / 1000;
        let max = this.activeDevice.instruments.awg.chans[0].signalFreqMax / 1000;    
        switch (input) {
            case 'startFreq':     
                this.startFreq = Math.min(Math.max(min, this.utilityService.parseBaseNumberVal(event)), max);
                if (this.startFreq > this.stopFreq) {
                    this.stopFreq = this.startFreq;
                }
                break;
            case 'stopFreq':            
                this.stopFreq = Math.min(Math.max(min, this.utilityService.parseBaseNumberVal(event)), max);
                if (this.stopFreq < this.startFreq) {
                    this.startFreq = this.stopFreq;
                }
                break;
            default:
        }
    }

    done() {
        if (this.dismissCallback != undefined) {
            this.dismissCallback();
        }
        this.navCtrl.pop();
    }

    start() {
        if (this.startFreq === this.stopFreq || this.startFreq > this.stopFreq) {
            this.toastService.createToast('bodeInvalidRange', true);
            return;
        }
        this.bodeComponent.startSweep(this.startFreq, this.stopFreq, parseInt(this.stepsPerDec), true, this.vertScale === 'Log', this.sweepType)
            .then((data) => {
                console.log(data);
            })
            .catch((e) => {
                console.log(e);
                if (e === 'interrupted') {
                    this.toastService.createToast('bodeAborted', true);
                }
            });
    }

}

export type BodeInput = 'startFreq' | 'stopFreq';