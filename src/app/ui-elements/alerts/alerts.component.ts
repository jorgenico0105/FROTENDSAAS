import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-alerts',
    imports: [RouterLink],
    templateUrl: './alerts.component.html',
    styleUrl: './alerts.component.scss'
})
export class AlertsComponent {

    showAlert = true;
    showAlert2 = true;
    showAlert3 = true;
    showAlert4 = true;
    showAlert5 = true;
    showAlert6 = true;
    showAlert7 = true;
    showAlert8 = true;

    dismissAlert() {
        this.showAlert = false;
    }
    dismissAlert2() {
        this.showAlert2 = false;
    }
    dismissAlert3() {
        this.showAlert3 = false;
    }
    dismissAlert4() {
        this.showAlert4 = false;
    }
    dismissAlert5() {
        this.showAlert5 = false;
    }
    dismissAlert6() {
        this.showAlert6 = false;
    }
    dismissAlert7() {
        this.showAlert7 = false;
    }
    dismissAlert8() {
        this.showAlert8 = false;
    }

}