import { Component } from '@angular/core';

@Component({
    selector: 'app-mp-to-do-list',
    imports: [],
    templateUrl: './mp-to-do-list.component.html',
    styleUrl: './mp-to-do-list.component.scss'
})
export class MpToDoListComponent {

    // Popup Trigger
    classApplied = false;
    toggleClass() {
        this.classApplied = !this.classApplied;
    }

}