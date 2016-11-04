import { Component } from '@angular/core';
import { PopoverController } from 'ionic-angular';

//Components
import { GenPopover } from '../../components/gen-popover/gen-popover.component';

//Services
import { StorageService } from '../../services/storage/storage.service';
import { SettingsService } from '../../services/settings/settings.service';

@Component({
    templateUrl: 'settings.html',
})
export class SettingsPage {
    public storageService: StorageService;
    public popoverCtrl: PopoverController;
    public settingsService: SettingsService;
    public defaultConsoleLog;
    public logArguments;

    constructor(_storageService: StorageService, _popCtrl: PopoverController, _settingsService: SettingsService) {
        this.storageService = _storageService;
        this.settingsService = _settingsService;
        this.popoverCtrl = _popCtrl;
        console.log('settings constructor');
    }

    changeConsoleLog(event) {
        let popover = this.popoverCtrl.create(GenPopover, {
            dataArray: ['console', 'local storage', 'both', 'none']
        });
        popover.onDidDismiss((data) => {
            if (data === null) { return; }
            this.settingsService.changeConsoleLog(data.option);

        });
        popover.present({
            ev: event
        });
    }

    exportLogFile() {
        this.settingsService.exportLogFile();
    }

    clearAppLog() {
        this.settingsService.clearAppLog();
    }
}