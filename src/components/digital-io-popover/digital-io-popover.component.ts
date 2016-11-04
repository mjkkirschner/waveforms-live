import {Component} from '@angular/core';
import {ViewController, NavParams} from 'ionic-angular';

//Components
import { DigitalIoComponent } from '../digital-io/digital-io.component';

@Component({
  templateUrl: 'digital-io-popover.html'
})

export class DigitalIoPopover {
    public digitalComponent: DigitalIoComponent;

    constructor(
        public viewCtrl: ViewController, 
        public params: NavParams
    ) {
        this.digitalComponent = this.params.get('digitalComponent');
    }

    //Close popover and send option string as a NavParam
    close(option: string) {
        this.viewCtrl.dismiss({
            option: option
        });
    }

    setDirection(channel: number) {
        this.digitalComponent.gpioDirections[channel] = !this.digitalComponent.gpioDirections[channel];
        let stringDirection = this.digitalComponent.gpioDirections[channel] === true ? 'output' : 'input';
        this.digitalComponent.activeDev.instruments.gpio.setParameters([channel + 1], [stringDirection]).subscribe(
            (data) => {
                console.log('set direction');
            },
            (err) => {
                console.log(err);
            },
            () => {
                
            }
        );
    }

    setAll() {
        let chanArray = [];
        let valArray = [];
        for (let i = 0; i < this.digitalComponent.gpioChans.length; i++) {
            if (this.digitalComponent.gpioDirections[i] === false) {
                this.digitalComponent.gpioDirections[i] = true;
                this.digitalComponent.gpioVals[i] = false;
            }
            chanArray.push(i + 1);
            valArray.push(this.digitalComponent.gpioDirections[i] === true ? 'output' : 'input');
        }
        this.digitalComponent.activeDev.instruments.gpio.setParameters(chanArray, valArray).subscribe(
            (data) => {
                console.log('set direction');
            },
            (err) => {
                console.log(err);
            },
            () => {
                
            }
        );
    }

    setNone() {
        let chanArray = [];
        let valArray = [];
        for (let i = 0; i < this.digitalComponent.gpioChans.length; i++) {
            this.digitalComponent.gpioDirections[i] = false;
            if (this.digitalComponent.gpioVals[i] === true) {
                this.digitalComponent.gpioVals[i] = false;
            }
            chanArray.push(i + 1);
            valArray.push(this.digitalComponent.gpioDirections[i] === true ? 'output' : 'input');
        }
        this.digitalComponent.activeDev.instruments.gpio.setParameters(chanArray, valArray).subscribe(
            (data) => {
                console.log('set direction');
            },
            (err) => {
                console.log(err);
            },
            () => {
                
            }
        );
    }
}