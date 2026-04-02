import { Component } from '@angular/core';
import { TicketsNewOpenService } from './tickets-new-open.service';

@Component({
    selector: 'app-tickets-new-open:not(1)',
    imports: [],
    templateUrl: './tickets-new-open.component.html',
    styleUrl: './tickets-new-open.component.scss'
})
export class TicketsNewOpenComponent {

    constructor(
        private ticketsNewOpenService: TicketsNewOpenService
    ) {}

    ngOnInit(): void {
        this.ticketsNewOpenService.loadChart();
    }

}